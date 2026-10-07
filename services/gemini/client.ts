import "server-only";

import { GoogleGenAI, type Schema } from "@google/genai";

import { GEMINI_CONFIG } from "@/config/gemini";
import { getGeminiEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export { GEMINI_CONFIG };

export type GeminiClientErrorCode =
	| "CONFIGURATION_ERROR"
	| "AUTHENTICATION_ERROR"
	| "RATE_LIMITED"
	| "INVALID_REQUEST"
	| "PROVIDER_UNAVAILABLE"
	| "NETWORK_ERROR"
	| "TIMEOUT"
	| "EMPTY_RESPONSE"
	| "INVALID_RESPONSE"
	| "PROVIDER_ERROR"
	| "UNKNOWN_ERROR";

const MAX_GENERATION_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 150;

export class GeminiClientError extends Error {
	constructor(
		public readonly code: GeminiClientErrorCode,
		message: string,
		public readonly providerStatus?: number,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = "GeminiClientError";
	}
}

export interface GeminiGenerationOptions {
	temperature?: number;
	maxOutputTokens?: number;
}

export interface GeminiClient {
	generateText(
		prompt: string,
		options?: GeminiGenerationOptions,
	): Promise<string>;
	generateStructured(
		prompt: string,
		schema: Schema,
		options?: GeminiGenerationOptions,
	): Promise<unknown>;
}

export interface GeminiClientDependencies {
	getApiKey: () => string;
	getProvider: (apiKey: string) => Pick<GoogleGenAI, "models">;
	sleep: (delayMs: number) => Promise<void>;
}

interface ProviderErrorDetails {
	status?: number;
	code?: string | number;
	name?: string;
	cause?: unknown;
}

let provider: GoogleGenAI | null = null;
let client: GeminiClient | null = null;

function getProvider(apiKey: string): GoogleGenAI {
	if (provider) return provider;

	try {
		provider = new GoogleGenAI({ apiKey });
		return provider;
	} catch (error) {
		throw new GeminiClientError(
			"CONFIGURATION_ERROR",
			"Gemini client configuration is invalid.",
			undefined,
			{ cause: error },
		);
	}
}

function getProviderErrorDetails(error: unknown): ProviderErrorDetails {
	if (typeof error !== "object" || error === null) return {};

	const details = error as Record<string, unknown>;
	const response =
		typeof details.response === "object" && details.response !== null
			? (details.response as Record<string, unknown>)
			: undefined;
	const statusValue = details.status ?? details.statusCode ?? response?.status;
	const status = typeof statusValue === "number" ? statusValue : undefined;
	const codeValue = details.code;
	const code =
		typeof codeValue === "string" || typeof codeValue === "number"
			? codeValue
			: undefined;

	return {
		status,
		code,
		name: typeof details.name === "string" ? details.name : undefined,
		cause: details.cause,
	};
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return typeof error === "string" ? error : "Unknown provider failure.";
}

function redactSensitiveDetails(message: string, apiKey: string): string {
	return (apiKey ? message.replaceAll(apiKey, "[REDACTED]") : message)
		.replace(/AIza[\w-]{20,}/g, "[REDACTED]")
		.replace(/(authorization\s*[:=]\s*)([^\s,;]+)/gi, "$1[REDACTED]");
}

function normalizeProviderError(error: unknown, apiKey: string): GeminiClientError {
	if (error instanceof GeminiClientError) return error;

	const details = getProviderErrorDetails(error);
	const providerCode = String(details.code ?? "").toUpperCase();
	const errorName = details.name?.toUpperCase() ?? "";
	const nestedCode =
		typeof details.cause === "object" && details.cause !== null
			? String((details.cause as Record<string, unknown>).code ?? "").toUpperCase()
			: "";
	const code: GeminiClientErrorCode =
		details.status === 429 ||
		providerCode === "429" ||
		providerCode.includes("RESOURCE_EXHAUSTED")
			? "RATE_LIMITED"
			: details.status === 401 ||
				  details.status === 403 ||
				  providerCode.includes("UNAUTHENTICATED") ||
				  providerCode.includes("PERMISSION_DENIED")
				? "AUTHENTICATION_ERROR"
				: details.status === 400 || providerCode === "400"
					? "INVALID_REQUEST"
					: details.status === 408 ||
					    errorName.includes("TIMEOUT") ||
					    errorName === "ABORTERROR" ||
					    nestedCode.includes("ETIMEDOUT") ||
					    nestedCode.includes("ESOCKETTIMEDOUT")
						? "TIMEOUT"
						: details.status === 500 ||
						    details.status === 502 ||
						    details.status === 503 ||
						    details.status === 504
							? "PROVIDER_UNAVAILABLE"
								: details.status !== undefined
								? "PROVIDER_ERROR"
								: errorName === "TYPEERROR" ||
								    errorName.includes("CONNECTION") ||
								    nestedCode.includes("ECONN") ||
								    nestedCode.includes("EAI_AGAIN") ||
								    nestedCode.includes("ENOTFOUND")
									? "NETWORK_ERROR"
									: "UNKNOWN_ERROR";

	return new GeminiClientError(
		code,
		redactSensitiveDetails(getErrorMessage(error), apiKey),
		details.status,
		{ cause: error },
	);
}

function isRetryable(error: GeminiClientError): boolean {
	return [
		"RATE_LIMITED",
		"PROVIDER_UNAVAILABLE",
		"NETWORK_ERROR",
		"TIMEOUT",
	].includes(error.code);
}

function defaultSleep(delayMs: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function createGeminiClient(
	dependencies: GeminiClientDependencies = {
		getApiKey: () => getGeminiEnv().GEMINI_API_KEY,
		getProvider,
		sleep: defaultSleep,
	},
): GeminiClient {
	async function generate(
		prompt: string,
		operation: "text" | "structured",
		options: GeminiGenerationOptions,
		schema?: Schema,
	): Promise<string> {
		const startedAt = Date.now();
		let apiKey: string;
		let providerClient: Pick<GoogleGenAI, "models">;

		try {
			apiKey = dependencies.getApiKey();
			providerClient = dependencies.getProvider(apiKey);
		} catch (error) {
			const configurationError =
				error instanceof GeminiClientError
					? error
					: new GeminiClientError(
							"CONFIGURATION_ERROR",
							"Gemini client configuration is invalid.",
							undefined,
							{ cause: error },
						);
			logger.error("Gemini client configuration failed", {
				model: GEMINI_CONFIG.model,
				category: configurationError.code,
				operation,
				attempt: 1,
			});
			throw configurationError;
		}

		for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
			try {
				const response = await providerClient.models.generateContent({
					model: GEMINI_CONFIG.model,
					contents: prompt,
					config: {
						temperature: options.temperature ?? GEMINI_CONFIG.defaultTemperature,
						httpOptions: { retryOptions: { attempts: 1 } },
						...(options.maxOutputTokens === undefined
							? {}
							: { maxOutputTokens: options.maxOutputTokens }),
						...(schema
							? { responseMimeType: "application/json", responseSchema: schema }
							: {}),
					},
				});

				const text = response.text?.trim();
				if (!text) {
					throw new GeminiClientError(
						"EMPTY_RESPONSE",
						"Gemini returned no usable text.",
					);
				}

				logger.info("Gemini generation succeeded", {
					operation,
					model: GEMINI_CONFIG.model,
					attempt,
					durationMs: Date.now() - startedAt,
				});
				return text;
			} catch (error) {
				const normalized = normalizeProviderError(error, apiKey);
				const retry = attempt < MAX_GENERATION_ATTEMPTS && isRetryable(normalized);
				logger[retry ? "warn" : "error"]("Gemini generation failed", {
					operation,
					model: GEMINI_CONFIG.model,
					category: normalized.code,
					providerStatus: normalized.providerStatus,
					attempt,
					maxAttempts: MAX_GENERATION_ATTEMPTS,
					retrying: retry,
					durationMs: Date.now() - startedAt,
				});
				if (!retry) throw normalized;
				await dependencies.sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
			}
		}

		throw new GeminiClientError("UNKNOWN_ERROR", "Gemini generation failed.");
	}

	function parseStructuredResponse(text: string): unknown {
		try {
			return JSON.parse(text) as unknown;
		} catch (error) {
			logger.error("Gemini structured response was invalid", {
				operation: "structured",
				model: GEMINI_CONFIG.model,
				category: "INVALID_RESPONSE",
			});
			throw new GeminiClientError(
				"INVALID_RESPONSE",
				"Gemini returned invalid JSON for a structured response.",
				undefined,
				{ cause: error },
			);
		}
	}

	return {
		async generateText(prompt, options = {}) {
			return generate(prompt, "text", options);
		},
		async generateStructured(prompt, schema, options = {}) {
			const text = await generate(prompt, "structured", options, schema);
			return parseStructuredResponse(text);
		},
	};
}

export function getGeminiClient(): GeminiClient {
	if (client) return client;
	client = createGeminiClient();
	return client;
}
