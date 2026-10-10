import "server-only";

import { z } from "zod";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
	GeminiRecommendationOutputSchema,
	RecommendationRequestSchema,
} from "@/schemas/recommendations";
import { GeminiClientError, getGeminiClient } from "@/services/gemini/client";
import type {
	RecommendationCandidate,
	RecommendationRequest,
} from "@/types/recommendation";

import { GEMINI_RECOMMENDATION_SYSTEM_PROMPT } from "./recommendation-prompt";

type GeminiSchema = Parameters<
	ReturnType<typeof getGeminiClient>["generateStructured"]
>[1];

const GEMINI_SCHEMA_TYPES: Record<string, string> = {
	string: "STRING",
	number: "NUMBER",
	integer: "INTEGER",
	boolean: "BOOLEAN",
	object: "OBJECT",
	array: "ARRAY",
};

function isJsonSchemaObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullSchema(value: unknown): boolean {
	if (!isJsonSchemaObject(value)) return false;
	return (
		value.type === "null" ||
		(Array.isArray(value.type) &&
			value.type.length === 1 &&
			value.type[0] === "null")
	);
}

function toGeminiSchema(value: unknown): GeminiSchema {
	if (!isJsonSchemaObject(value)) {
		throw new Error("Recommendation output schema must be a JSON Schema object.");
	}

	const schema: Record<string, unknown> = {};
	const type = value.type;
	if (typeof type === "string") {
		if (type === "null") {
			schema.nullable = true;
		} else {
			const geminiType = GEMINI_SCHEMA_TYPES[type];
			if (!geminiType) {
				throw new Error(`Unsupported recommendation schema type: ${type}.`);
			}
			schema.type = geminiType;
		}
	}
	if (Array.isArray(type) && type.length > 0) {
		const nonNullType = type.find((entry) => entry !== "null");
		if (typeof nonNullType === "string" && nonNullType !== "null") {
			const geminiType = GEMINI_SCHEMA_TYPES[nonNullType];
			if (geminiType) schema.type = geminiType;
		}
		if (type.includes("null")) {
			schema.nullable = true;
		}
	}

	for (const field of ["description", "format", "nullable"] as const) {
		if (value[field] !== undefined) schema[field] = value[field];
	}
	if (typeof value.title === "string") schema.title = value.title;
	if (Array.isArray(value.required)) schema.required = value.required;
	if (Array.isArray(value.enum)) schema.enum = value.enum;
	if (typeof value.const === "string") schema.enum = [value.const];
	if (typeof value.minimum === "number") schema.minimum = value.minimum;
	if (typeof value.maximum === "number") schema.maximum = value.maximum;
	if (typeof value.minLength === "number") schema.minLength = String(value.minLength);
	if (typeof value.minItems === "number") schema.minItems = String(value.minItems);
	if (isJsonSchemaObject(value.properties)) {
		schema.properties = Object.fromEntries(
			Object.entries(value.properties).map(([key, property]) => [
				key,
				toGeminiSchema(property),
			]),
		);
	}
	if (value.items !== undefined) schema.items = toGeminiSchema(value.items);

	const union = Array.isArray(value.anyOf)
		? value.anyOf
		: Array.isArray(value.oneOf)
			? value.oneOf
			: undefined;
	if (union) {
		const includesNull = union.some(isNullSchema);
		const branches = union.filter((branch) => !isNullSchema(branch)).map(toGeminiSchema);
		if (branches.length === 1) {
			Object.assign(schema, branches[0]);
		} else if (branches.length > 1) {
			schema.anyOf = branches;
		}
		if (includesNull) schema.nullable = true;
	}

	return schema as GeminiSchema;
}

const recommendationOutputSchema = toGeminiSchema(
	z.toJSONSchema(GeminiRecommendationOutputSchema),
);

function buildRecommendationPrompt(request: RecommendationRequest): string {
	return [
		GEMINI_RECOMMENDATION_SYSTEM_PROMPT,
		"CURRENT USER STATE (JSON):",
		JSON.stringify({
			tasteProfile: request.tasteProfile,
			confidence: request.confidence,
			personality: request.personality,
		}),
	].join("\n\n");
}

export async function generateRecommendations(
	request: RecommendationRequest,
): Promise<RecommendationCandidate[]> {
	const parsed = RecommendationRequestSchema.safeParse(request);
	if (!parsed.success) {
		throw new AppError(
			"INVALID_REQUEST",
			"The recommendation request is invalid.",
			400,
		);
	}

	let generated: unknown;
	try {
		generated = await getGeminiClient().generateStructured(
			buildRecommendationPrompt(parsed.data),
			recommendationOutputSchema,
			{ temperature: 0.4, maxOutputTokens: 2000 },
		);
	} catch (error) {
		if (!(error instanceof GeminiClientError)) {
			throw error;
		}

		const mapped =
			error.code === "RATE_LIMITED"
				? new AppError(
						"RATE_LIMITED",
						"The recommendation service is busy. Please try again shortly.",
						429,
					)
				: error.code === "AUTHENTICATION_ERROR" ||
						error.code === "CONFIGURATION_ERROR"
					? new AppError(
							"AI_SERVICE_ERROR",
							"The recommendation service is unavailable right now.",
							503,
						)
					: error.code === "TIMEOUT" ||
						error.code === "NETWORK_ERROR" ||
						error.code === "PROVIDER_UNAVAILABLE"
						? new AppError(
								"AI_SERVICE_ERROR",
								"The recommendation service is temporarily unavailable.",
								503,
							)
						: new AppError(
								"AI_SERVICE_ERROR",
								"The recommendation service could not produce valid candidates.",
								502,
							);

		throw mapped;
	}

	const result = GeminiRecommendationOutputSchema.safeParse(generated);
	if (!result.success) {
		logger.error("Gemini recommendation output failed validation", {
			category: "INVALID_OUTPUT",
			issues: result.error.issues.map((issue) => ({
				path: issue.path,
				code: issue.code,
			})),
		});
		throw new AppError(
			"AI_SERVICE_ERROR",
			"The recommendation service returned an invalid candidate pool.",
			502,
		);
	}

	return result.data.candidates;
}
