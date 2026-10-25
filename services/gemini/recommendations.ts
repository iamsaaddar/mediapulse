import "server-only";

import { z } from "zod";
import { getMovieGenreNames } from "@/constants/movie-genres";
import { MAX_DISCOVERY_LANES, MAX_SELECTION_RETRIES, RECOMMENDATION_COUNT } from "@/constants/limits";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { DiscoveryPlanSchema } from "@/schemas/discovery";
import { GeminiRecommendationSelectionSchema, RecommendationRequestSchema } from "@/schemas/recommendations";
import { GeminiClientError, getGeminiClient } from "@/services/gemini/client";
import type { RecommendationRequest } from "@/types/recommendation";
import type { DiscoveredMovie } from "@/types/movie";
import type { CandidateProvenance } from "@/services/recommendations/discovery-plan";
import { GEMINI_DISCOVERY_PLAN_SYSTEM_PROMPT, GEMINI_FINAL_SELECTION_SYSTEM_PROMPT } from "./recommendation-prompt";

type GeminiSchema = Parameters<ReturnType<typeof getGeminiClient>["generateStructured"]>[1];
const geminiTypes: Record<string, string> = { string: "STRING", number: "NUMBER", integer: "INTEGER", boolean: "BOOLEAN", object: "OBJECT", array: "ARRAY" };

function convertSchema(value: unknown): GeminiSchema {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected JSON schema object.");
	const source = value as Record<string, unknown>;
	const target: Record<string, unknown> = {};
	if (typeof source.type === "string") target.type = geminiTypes[source.type] ?? source.type;
	for (const field of ["description", "required", "enum", "minimum", "maximum"] as const) {
		if (source[field] !== undefined) target[field] = source[field];
	}
	if (typeof source.minItems === "number") target.minItems = String(source.minItems);
	if (typeof source.minLength === "number") target.minLength = String(source.minLength);
	if (source.properties && typeof source.properties === "object" && !Array.isArray(source.properties)) {
		target.properties = Object.fromEntries(Object.entries(source.properties).map(([key, item]) => [key, convertSchema(item)]));
	}
	if (source.items) target.items = convertSchema(source.items);
	return target as GeminiSchema;
}

const discoveryOutputSchema = convertSchema(z.toJSONSchema(DiscoveryPlanSchema));
const selectionSchema = convertSchema(z.toJSONSchema(GeminiRecommendationSelectionSchema));

function mapGeminiError(error: unknown): never {
	if (!(error instanceof GeminiClientError)) throw error;
	const limited = error.code === "RATE_LIMITED";
	throw new AppError(limited ? "RATE_LIMITED" : "AI_SERVICE_ERROR", limited
		? "The recommendation service is busy. Please try again shortly."
		: "The recommendation service is temporarily unavailable.", limited ? 429 : 502);
}

function requestContext(request: RecommendationRequest) {
	return JSON.stringify({
		tasteProfile: request.tasteProfile,
		preferences: { ...request.preferences, selectedGenres: getMovieGenreNames(request.preferences.genreIds) },
		confidence: request.confidence,
		personality: request.personality,
	});
}

export async function generateDiscoveryPlan(request: RecommendationRequest) {
	const parsedRequest = RecommendationRequestSchema.safeParse(request);
	if (!parsedRequest.success) throw new AppError("INVALID_REQUEST", "The recommendation request is invalid.", 400);
	let generated: unknown;
	try {
		generated = await getGeminiClient().generateStructured([
			GEMINI_DISCOVERY_PLAN_SYSTEM_PROMPT,
			"USER TASTE PROFILE (JSON):", requestContext(parsedRequest.data),
		].join("\n\n"), discoveryOutputSchema, { temperature: 0.25, maxOutputTokens: 1800 });
	} catch (error) { mapGeminiError(error); }
	const result = DiscoveryPlanSchema.safeParse(generated);
	if (!result.success || result.data.lanes.length > MAX_DISCOVERY_LANES) {
		throw new AppError("AI_SERVICE_ERROR", "The discovery service returned an invalid search plan.", 502);
	}
	return result.data;
}

const candidateSummary = (movie: DiscoveredMovie, provenance?: CandidateProvenance) => ({
	tmdbId: movie.tmdbId,
	title: movie.title,
	releaseYear: /^\d{4}/.exec(movie.releaseDate)?.[0] ?? null,
	releaseDate: movie.releaseDate,
	overview: movie.overview.slice(0, 900),
	genres: getMovieGenreNames(movie.genreIds),
	originalLanguage: movie.originalLanguage,
	matchedTmdbKeywords: provenance?.keywordConcepts ?? [],
});

export async function selectFinalRecommendations(
	request: RecommendationRequest,
	pool: DiscoveredMovie[],
	provenance?: Map<number, CandidateProvenance>,
) {
	const uniquePool = [...new Map(pool.map((movie) => [movie.tmdbId, movie])).values()];
	if (uniquePool.length < RECOMMENDATION_COUNT) throw new AppError("INSUFFICIENT_RESULTS", "We could not find seven eligible movies that meet your filters. Try broadening your genres, decades, or languages.", 422);
	const allowedIds = new Set(uniquePool.map(({ tmdbId }) => tmdbId));
	let lastInvalid = false;
	for (let attempt = 0; attempt <= MAX_SELECTION_RETRIES; attempt += 1) {
		let generated: unknown;
		try {
			generated = await getGeminiClient().generateStructured([
				GEMINI_FINAL_SELECTION_SYSTEM_PROMPT,
				attempt > 0 ? "Your previous answer contained an invalid or repeated ID. Select exactly seven unique IDs only from this list." : "",
				"USER TASTE PROFILE (JSON):", requestContext(request),
				"TMDB CANDIDATE POOL (JSON):", JSON.stringify(uniquePool.map((movie) => candidateSummary(movie, provenance?.get(movie.tmdbId)))),
			].filter(Boolean).join("\n\n"), selectionSchema, { temperature: 0.25, maxOutputTokens: 2400 });
		} catch (error) { mapGeminiError(error); }
		const parsed = GeminiRecommendationSelectionSchema.safeParse(generated);
		if (parsed.success && parsed.data.selections.every(({ tmdbId }) => allowedIds.has(tmdbId))) return parsed.data.selections;
		lastInvalid = true;
	}
	if (lastInvalid) {
		logger.warn("Gemini selection did not satisfy the verified candidate contract", { category: "INVALID_OUTPUT", candidateCount: uniquePool.length });
		throw new AppError("AI_SERVICE_ERROR", "The recommendation service could not produce a valid selection. Please try again.", 502);
	}
	throw new AppError("AI_SERVICE_ERROR", "The recommendation service could not complete your collection.", 502);
}
