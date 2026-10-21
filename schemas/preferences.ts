import { z } from "zod";

import { DECADES, SUPPORTED_LANGUAGES } from "@/constants/preferences";
import { boundedNonBlankText } from "./common";
import { VibeKeywordSchema } from "./vibes";

export const PreferenceSelectionSchema = z.object({
	anchorMovie: boundedNonBlankText(150),
	vibes: z.array(VibeKeywordSchema).min(1).max(15),
	decades: z.array(z.number().int().refine((value) => DECADES.includes(value as (typeof DECADES)[number]))).max(DECADES.length),
	languages: z.array(z.enum(SUPPORTED_LANGUAGES.map(({ code }) => code) as [string, ...string[]])).max(SUPPORTED_LANGUAGES.length),
}).strict().superRefine((preferences, context) => {
	const decadeSet = new Set(preferences.decades);
	if (decadeSet.size !== preferences.decades.length) {
		context.addIssue({ code: "custom", path: ["decades"], message: "Decades must be unique." });
	}
	const languageSet = new Set(preferences.languages);
	if (languageSet.size !== preferences.languages.length) {
		context.addIssue({ code: "custom", path: ["languages"], message: "Languages must be unique." });
	}
});

export type PreferenceSelection = z.infer<typeof PreferenceSelectionSchema>;

