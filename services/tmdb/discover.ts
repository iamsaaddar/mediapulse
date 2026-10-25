import { z } from "zod";
import { TMDB_MOVIE_GENRES } from "@/constants/movie-genres";
import { DiscoveredMovieSchema } from "@/schemas/movie";
import { fetchTmdb } from "./client";

const DiscoverQuerySchema = z.object({
	genreIds: z.array(z.number().int().positive()).max(TMDB_MOVIE_GENRES.length),
	keywordIds: z.array(z.number().int().positive()).max(5),
	decades: z.array(z.number().int().min(1880).max(2090)).max(1),
	// Discover accepts one original language per request. The query planner
	// creates one complementary query per selected language.
	languages: z.array(z.string().regex(/^[a-z]{2}$/)).max(1),
	page: z.number().int().min(1).max(500),
	sortBy: z.enum(["primary_release_date.asc", "primary_release_date.desc", "original_title.asc"]),
}).strict();

export type TmdbDiscoverQuery = z.infer<typeof DiscoverQuerySchema>;
export interface TmdbDiscoverPage { items: z.infer<typeof DiscoveredMovieSchema>[]; totalPages: number }

export async function discoverMovies(query: TmdbDiscoverQuery): Promise<TmdbDiscoverPage> {
	const safe = DiscoverQuerySchema.parse(query);
	const { genreIds, keywordIds, decades, languages } = safe;
	const params: Record<string, string | number | undefined> = {
		include_adult: "false",
		include_video: "false",
		sort_by: safe.sortBy,
		// TMDB comma-separated genre IDs mean AND; every selected genre is required.
		with_genres: genreIds.length ? genreIds.join(",") : undefined,
		with_keywords: keywordIds.length ? keywordIds.join("|") : undefined,
		with_original_language: languages[0],
		page: safe.page,
	};
	if (decades.length === 1) {
		const decade = decades[0];
		params["primary_release_date.gte"] = `${decade}-01-01`;
		params["primary_release_date.lte"] = `${decade + 9}-12-31`;
	}
	const response = await fetchTmdb<{ results?: unknown[]; total_pages?: number }>("/discover/movie", params);
	const items = Array.isArray(response.results) ? response.results.flatMap((item) => {
		if (typeof item !== "object" || item === null) return [];
		const raw = item as Record<string, unknown>;
		const title = typeof raw.title === "string" ? raw.title : "";
		const parsed = DiscoveredMovieSchema.safeParse({
			tmdbId: raw.id,
			title,
			originalTitle: typeof raw.original_title === "string" && raw.original_title ? raw.original_title : title,
			releaseDate: typeof raw.release_date === "string" ? raw.release_date : "",
			overview: typeof raw.overview === "string" ? raw.overview : "",
			posterPath: typeof raw.poster_path === "string" ? raw.poster_path : null,
			backdropPath: typeof raw.backdrop_path === "string" ? raw.backdrop_path : null,
			genreIds: Array.isArray(raw.genre_ids) ? raw.genre_ids : [],
			originalLanguage: typeof raw.original_language === "string" ? raw.original_language : "",
		});
		return parsed.success ? [parsed.data] : [];
	}) : [];
	const totalPages = typeof response.total_pages === "number" && Number.isFinite(response.total_pages)
		? Math.min(500, Math.max(0, response.total_pages)) : 0;
	return { items, totalPages };
}
