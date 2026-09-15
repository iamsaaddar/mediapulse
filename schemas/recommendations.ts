import { z } from "zod";

import { TasteProfileSchema } from "./common";
import { VerifiedMovieSchema } from "./movie";

export const RecommendationCandidateSchema = z.object({
	title: z.string().min(1),
	year: z.number().int().min(1888).max(2100).nullable(),
	reason: z.string().min(1),
});

export const PersonalitySchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	traits: z.array(z.string().min(1)).min(1),
});

export const RecommendationRequestSchema = z.object({
	tasteProfile: TasteProfileSchema,
});

export const RecommendationResponseSchema = z.object({
	personality: PersonalitySchema,
	recommendations: z.array(
		z.object({
			reason: z.string().min(1),
			movie: VerifiedMovieSchema,
		}),
	).length(5),
});
