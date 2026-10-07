import "server-only";

import {
	GeminiClientError,
	getGeminiClient,
} from "@/services/gemini/client";
import { MAX_QUESTIONS, MIN_QUESTIONS } from "@/constants/limits";
import { InterviewResponseSchema } from "@/schemas/interview";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { InterviewRequest, InterviewResponse } from "@/types/interview";
import { z } from "zod";

import { GEMINI_INTERVIEW_SYSTEM_PROMPT } from "./interview-prompt";

type GeminiSchema = Parameters<
	ReturnType<typeof getGeminiClient>["generateStructured"]
>[1];

type JsonSchemaObject = Record<string, unknown>;

const GEMINI_SCHEMA_TYPES: Record<string, string> = {
	string: "STRING",
	number: "NUMBER",
	integer: "INTEGER",
	boolean: "BOOLEAN",
	object: "OBJECT",
	array: "ARRAY",
};

function isJsonSchemaObject(value: unknown): value is JsonSchemaObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toGeminiSchema(value: unknown): GeminiSchema {
	if (!isJsonSchemaObject(value)) {
		throw new Error("Interview response schema must be a JSON Schema object.");
	}

	const schema: JsonSchemaObject = {};
	const type = value.type;
	if (typeof type === "string") {
		const geminiType = GEMINI_SCHEMA_TYPES[type];
		if (!geminiType) {
			throw new Error(`Unsupported interview schema type: ${type}.`);
		}
		schema.type = geminiType;
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
	// V1 array caps remain enforced by InterviewResponseSchema after generation.
	// The selected Gemini model rejects maxItems in its structured-output schema.
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
		schema.anyOf = union.map(toGeminiSchema);
	}

	return schema as GeminiSchema;
}

const interviewResponseSchema = toGeminiSchema(
	z.toJSONSchema(InterviewResponseSchema),
);

function buildInterviewPrompt(request: InterviewRequest): string {
	const state = {
		questionCount: request.questionCount,
		tasteProfile: request.tasteProfile,
		lastInteraction: request.lastInteraction,
	};

	return [
		GEMINI_INTERVIEW_SYSTEM_PROMPT,
		"APPLICATION CONTRACT NOTE: The system prompt's `ending` and `preferences` are conceptual areas, not necessarily literal `TasteSignal.dimension` values. The schema maps `ending` to `ending_preference`; express `preferences` using the most suitable supported enum value. Use only enum values allowed by the response schema.",
		"CURRENT COMPACT INTERVIEW STATE (JSON):",
		JSON.stringify(state),
	].join("\n\n");
}

export async function runInterview(
	request: InterviewRequest,
): Promise<InterviewResponse> {
	let generated: unknown;
	try {
		generated = await getGeminiClient().generateStructured(
			buildInterviewPrompt(request),
			interviewResponseSchema,
		);
	} catch (error) {
		if (!(error instanceof GeminiClientError)) throw error;

		const mapped =
			error.code === "RATE_LIMITED"
				? new AppError(
						"RATE_LIMITED",
						"The AI service is busy. Please try again shortly.",
						429,
					)
				: error.code === "PROVIDER_UNAVAILABLE" ||
				    error.code === "NETWORK_ERROR" ||
				    error.code === "TIMEOUT" ||
				    error.code === "CONFIGURATION_ERROR"
					? new AppError(
							"AI_SERVICE_ERROR",
							"The AI service is temporarily unavailable. Please try again.",
							503,
						)
					: new AppError(
							"AI_SERVICE_ERROR",
							"The AI service could not complete this interview request.",
							502,
						);

		throw mapped;
	}
	const result = InterviewResponseSchema.safeParse(generated);

	if (!result.success) {
		logger.error("Gemini interview response failed validation", {
			category: "INVALID_OUTPUT",
			questionCount: request.questionCount,
			issues: result.error.issues.map((issue) => ({
				path: issue.path,
				code: issue.code,
			})),
		});
		throw new AppError(
			"AI_SERVICE_ERROR",
			"The interview service could not produce a valid response.",
			502,
		);
	}

	if (
		(result.data.status === "complete" && request.questionCount < MIN_QUESTIONS) ||
		(result.data.status === "continue" && request.questionCount >= MAX_QUESTIONS)
	) {
		logger.error("Gemini interview response violated application question limits", {
			category: "INTERVIEW_LIMIT_VIOLATION",
			questionCount: request.questionCount,
			status: result.data.status,
		});
		throw new AppError(
			"AI_SERVICE_ERROR",
			"The interview service could not produce a response within the question limits.",
			502,
		);
	}

	return result.data;
}
