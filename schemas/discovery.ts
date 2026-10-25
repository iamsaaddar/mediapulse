import { z } from "zod";

import { TMDB_MOVIE_GENRES } from "@/constants/movie-genres";
import { DECADES, SUPPORTED_LANGUAGES } from "@/constants/preferences";
import { boundedNonBlankText } from "./common";

export const TmdbGenreNameSchema = z.enum(
	TMDB_MOVIE_GENRES.map(({ name }) => name) as [string, ...string[]],
);

export const DiscoveryLaneSchema = z.object({
	strategy: z.enum([
		"core_taste",
		"thematic_exploration",
		"international_exploration",
		"era_exploration",
		"adjacent_discovery",
	]),
	genreNames: z.array(TmdbGenreNameSchema).max(5),
	keywordConcepts: z.array(boundedNonBlankText(80)).max(5),
	languageCodes: z.array(z.enum(SUPPORTED_LANGUAGES.map(({ code }) => code) as [string, ...string[]])).max(SUPPORTED_LANGUAGES.length),
	decades: z.array(z.number().int().refine((value) => DECADES.includes(value as (typeof DECADES)[number]))).max(DECADES.length),
}).strict().superRefine((lane, context) => {
	if (!lane.genreNames.length && !lane.keywordConcepts.length && !lane.languageCodes.length && !lane.decades.length) {
		context.addIssue({ code: "custom", path: ["genreNames"], message: "A discovery lane needs at least one usable TMDB search criterion." });
	}
	for (const field of ["genreNames", "keywordConcepts", "languageCodes", "decades"] as const) {
		const values = lane[field];
		if (new Set<unknown>(values).size !== values.length) {
			context.addIssue({ code: "custom", path: [field], message: `${field} values must be unique.` });
		}
	}
});

export const DiscoveryPlanSchema = z.object({
	lanes: z.array(DiscoveryLaneSchema).min(1).max(8),
}).strict().superRefine((plan, context) => {
	const strategies = plan.lanes.map(({ strategy }) => strategy);
	if (!strategies.includes("core_taste")) {
		context.addIssue({ code: "custom", path: ["lanes"], message: "The discovery plan must include a core taste lane." });
	}
});

export type DiscoveryPlan = z.infer<typeof DiscoveryPlanSchema>;
export type DiscoveryLane = z.infer<typeof DiscoveryLaneSchema>;
