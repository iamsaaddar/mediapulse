import { z } from "zod";

import {
	MAX_RECOMMENDATION_REASON_LENGTH,
	MAX_TASTE_SIGNALS,
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
import { PreferenceSelectionSchema } from "./preferences";

export const GeminiRecommendationSelectionSchema = z.object({
	selections: z.array(z.object({
		tmdbId: z.number().int().positive(),
		reason: boundedNonBlankText(MAX_RECOMMENDATION_REASON_LENGTH),
	}).strict()).length(RECOMMENDATION_COUNT),
}).strict().superRefine((data, context) => {
	const ids = data.selections.map(({ tmdbId }) => tmdbId);
	if (new Set(ids).size !== ids.length) {
		context.addIssue({ code: "custom", path: ["selections"], message: "Selection IDs must be unique." });
	}
});

export const RecommendationConfidenceSchema = z.object({ overall: ConfidenceSchema }).strict();
export const RecommendationPersonalitySchema = InterviewPersonalitySchema;
export const PersonalitySchema = InterviewPersonalitySchema;

export const RecommendationRequestSchema = z.object({
	tasteProfile: TasteProfileSchema.extend({
		signals: z.array(TasteSignalSchema.strict()).max(MAX_TASTE_SIGNALS),
	}).strict(),
	preferences: PreferenceSelectionSchema,
	confidence: RecommendationConfidenceSchema,
	personality: InterviewPersonalitySchema,
}).strict();

export const RecommendedMovieItemSchema = z.object({
	reason: boundedNonBlankText(MAX_RECOMMENDATION_REASON_LENGTH),
	movie: VerifiedMovieSchema,
}).strict();

export const RecommendationResponseSchema = z.object({
	personality: InterviewPersonalitySchema,
	recommendations: z.array(RecommendedMovieItemSchema).length(RECOMMENDATION_COUNT),
}).strict().superRefine((data, context) => {
	const ids = data.recommendations.map(({ movie }) => movie.tmdbId);
	if (new Set(ids).size !== ids.length) {
		context.addIssue({ code: "custom", path: ["recommendations"], message: "Recommendation IDs must be unique." });
	}
});
