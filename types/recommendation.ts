import type { z } from "zod";

import {
	GeminiRecommendationSelectionSchema,
	PersonalitySchema,
	RecommendationConfidenceSchema,
	RecommendationPersonalitySchema,
	RecommendationRequestSchema,
	RecommendationResponseSchema,
	RecommendedMovieItemSchema,
} from "@/schemas/recommendations";

export type GeminiRecommendationSelection = z.infer<typeof GeminiRecommendationSelectionSchema>;
export type RecommendationConfidence = z.infer<typeof RecommendationConfidenceSchema>;
export type RecommendationPersonality = z.infer<typeof RecommendationPersonalitySchema>;
export type Personality = z.infer<typeof PersonalitySchema>;
export type RecommendedMovieItem = z.infer<typeof RecommendedMovieItemSchema>;
export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;
export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;

export type RecommendationHandoffState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; response: RecommendationResponse }
	| { status: "error"; message: string };
