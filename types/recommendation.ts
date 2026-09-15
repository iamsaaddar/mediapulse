import type { z } from "zod";

import {
	RecommendationCandidateSchema,
	RecommendationRequestSchema,
	RecommendationResponseSchema,
	PersonalitySchema,
} from "@/schemas/recommendations";

export type RecommendationCandidate = z.infer<
	typeof RecommendationCandidateSchema
>;

export type RecommendationRequest = z.infer<
	typeof RecommendationRequestSchema
>;

export type RecommendationResponse = z.infer<
	typeof RecommendationResponseSchema
>;

export type Personality = z.infer<typeof PersonalitySchema>;
