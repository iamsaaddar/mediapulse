import { z } from "zod";

import { TASTE_DIMENSIONS } from "@/constants/taste-dimensions";

export const ConfidenceSchema = z
	.number()
	.min(0)
	.max(1);

export const TasteSignalSchema = z.object({
	dimension: z.enum(TASTE_DIMENSIONS),
	value: z.string().min(1),
	confidence: ConfidenceSchema,
});

export const TasteProfileSchema = z.object({
	signals: z.array(TasteSignalSchema),
	likes: z.array(z.string().min(1)),
	dislikes: z.array(z.string().min(1)),
});
