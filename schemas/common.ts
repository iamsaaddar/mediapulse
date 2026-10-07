import { z } from "zod";

import {
	MAX_TASTE_LIST_ITEMS,
	MAX_TASTE_LIST_ITEM_LENGTH,
	MAX_TASTE_SIGNALS,
	MAX_TASTE_SIGNAL_VALUE_LENGTH,
} from "@/constants/limits";
import { TASTE_DIMENSIONS } from "@/constants/taste-dimensions";

export function boundedNonBlankText(maxLength: number) {
	return z.string().min(1).max(maxLength).regex(/\S/);
}

export const ConfidenceSchema = z
	.number()
	.min(0)
	.max(1);

export const TasteSignalSchema = z.object({
	dimension: z.enum(TASTE_DIMENSIONS),
	value: boundedNonBlankText(MAX_TASTE_SIGNAL_VALUE_LENGTH),
	confidence: ConfidenceSchema,
});

export const TasteProfileSchema = z.object({
	signals: z.array(TasteSignalSchema).max(MAX_TASTE_SIGNALS),
	likes: z.array(boundedNonBlankText(MAX_TASTE_LIST_ITEM_LENGTH)).max(MAX_TASTE_LIST_ITEMS),
	dislikes: z.array(boundedNonBlankText(MAX_TASTE_LIST_ITEM_LENGTH)).max(MAX_TASTE_LIST_ITEMS),
});
