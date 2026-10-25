import { z } from "zod";

import { MAX_ANCHOR_NOTE_LENGTH } from "@/constants/limits";
import { DECADES, SUPPORTED_LANGUAGES } from "@/constants/preferences";
import { TMDB_MOVIE_GENRES } from "@/constants/movie-genres";
import { boundedNonBlankText } from "./common";
import { VibeKeywordSchema } from "./vibes";

export const PreferenceSelectionSchema = z.object({
	anchorMovie: boundedNonBlankText(150),
	anchorNote: z.string().trim().max(MAX_ANCHOR_NOTE_LENGTH).default(""),
	vibes: z.array(VibeKeywordSchema).min(1).max(15),
	genreIds: z.array(z.number().int().refine((value) => TMDB_MOVIE_GENRES.some(({ id }) => id === value))).max(TMDB_MOVIE_GENRES.length).default([]),
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
	const genreSet = new Set(preferences.genreIds);
	if (genreSet.size !== preferences.genreIds.length) {
		context.addIssue({ code: "custom", path: ["genreIds"], message: "Genres must be unique." });
	}
});

export type PreferenceSelection = z.infer<typeof PreferenceSelectionSchema>;

