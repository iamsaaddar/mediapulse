import { z } from "zod";

import {
	MAX_CANDIDATE_TITLE_LENGTH,
	MAX_RECOMMENDATION_CANDIDATES,
	MAX_RECOMMENDATION_REASON_LENGTH,
	MAX_TASTE_SIGNALS,
	MIN_MOVIE_YEAR,
	MIN_RECOMMENDATION_CANDIDATES,
	MAX_MOVIE_YEAR,
	RECOMMENDATION_COUNT,
} from "@/constants/limits";
import {
	boundedNonBlankText,
	ConfidenceSchema,
	TasteProfileSchema,
	TasteSignalSchema,
} from "./common";
import { InterviewPersonalitySchema } from "./interview";
import { VerifiedMovieSchema } from "./movie";

export const RecommendationCandidateSchema = z.object({
	title: boundedNonBlankText(MAX_CANDIDATE_TITLE_LENGTH),
	year: z.number().int().min(MIN_MOVIE_YEAR).max(MAX_MOVIE_YEAR).nullable(),
	reason: boundedNonBlankText(MAX_RECOMMENDATION_REASON_LENGTH),
}).strict();

export const GeminiRecommendationOutputSchema = z.object({
	candidates: z
		.array(RecommendationCandidateSchema)
		.min(MIN_RECOMMENDATION_CANDIDATES)
		.max(MAX_RECOMMENDATION_CANDIDATES),
}).strict();

export const RecommendationConfidenceSchema = z.object({
	overall: ConfidenceSchema,
}).strict();

export const RecommendationPersonalitySchema = InterviewPersonalitySchema;
export const PersonalitySchema = InterviewPersonalitySchema;

export const RecommendationRequestSchema = z.object({
	tasteProfile: TasteProfileSchema.extend({
		signals: z.array(TasteSignalSchema.strict()).max(MAX_TASTE_SIGNALS),
	}).strict(),
	confidence: RecommendationConfidenceSchema,
	personality: InterviewPersonalitySchema,
}).strict();

export const RecommendedMovieItemSchema = z.object({
	reason: boundedNonBlankText(MAX_RECOMMENDATION_REASON_LENGTH),
	movie: VerifiedMovieSchema,
}).strict();

export const RecommendationResponseSchema = z.object({
	personality: InterviewPersonalitySchema,
	recommendations: z
		.array(RecommendedMovieItemSchema)
		.length(RECOMMENDATION_COUNT),
}).strict().superRefine((data, context) => {
	const seenTmdbIds = new Set<number>();
	for (let i = 0; i < data.recommendations.length; i++) {
		const tmdbId = data.recommendations[i].movie.tmdbId;
		if (seenTmdbIds.has(tmdbId)) {
			context.addIssue({
				code: "custom",
				path: ["recommendations", i, "movie", "tmdbId"],
				message: `Duplicate movie recommendation with TMDB ID ${tmdbId}.`,
			});
		}
		seenTmdbIds.add(tmdbId);
	}
});
