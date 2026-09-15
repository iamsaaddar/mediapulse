import { z } from "zod";

export const ConfidenceSchema = z
	.number()
	.min(0)
	.max(1);

export const TasteSignalSchema = z.object({
	dimension: z.string().min(1),
	value: z.string().min(1),
	confidence: ConfidenceSchema,
});

export const TasteProfileSchema = z.object({
	signals: z.array(TasteSignalSchema),
	likes: z.array(z.string().min(1)),
	dislikes: z.array(z.string().min(1)),
});
