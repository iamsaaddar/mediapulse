import { z } from "zod";

import { boundedNonBlankText } from "./common";

export const VibeCategorySchema = z.enum([
	"atmosphere",
	"emotion",
	"micro_genre",
	"trope",
	"pacing",
	"visual_style",
]);

export const VibeKeywordSchema = z.object({
	tag: boundedNonBlankText(80),
	category: VibeCategorySchema,
}).strict();

export const VibeExtractionRequestSchema = z.object({
	movieTitle: boundedNonBlankText(150),
}).strict();

export const VibeExtractionOutputSchema = z.object({
	movieTitle: boundedNonBlankText(150),
	vibeKeywords: z.array(VibeKeywordSchema).min(10).max(15),
}).strict();

export const VibeExtractionResponseSchema = VibeExtractionOutputSchema.superRefine((response, context) => {
	const normalized = response.vibeKeywords.map(({ tag }) => tag.toLowerCase().trim());
	if (new Set(normalized).size !== normalized.length) {
		context.addIssue({ code: "custom", path: ["vibeKeywords"], message: "Vibe keywords must be distinct." });
	}
});

export type VibeKeyword = z.infer<typeof VibeKeywordSchema>;
export type VibeExtractionRequest = z.infer<typeof VibeExtractionRequestSchema>;
export type VibeExtractionResponse = z.infer<typeof VibeExtractionResponseSchema>;

