import { z } from "zod";
import { DiscoveredMovieSchema } from "@/schemas/movie";
import { fetchTmdb } from "./client";

export interface TmdbSimilarPage {
	items: z.infer<typeof DiscoveredMovieSchema>[];
	totalPages: number;
}

export async function getSimilarMovies(tmdbId: number, page = 1): Promise<TmdbSimilarPage> {
	if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) throw new Error("A valid TMDB movie ID is required.");
	if (!Number.isSafeInteger(page) || page < 1 || page > 500) throw new Error("A valid TMDB page is required.");
	const response = await fetchTmdb<{ results?: unknown[]; total_pages?: number }>(`/movie/${tmdbId}/similar`, {
		language: "en-US",
		page,
	});
	const items = Array.isArray(response.results) ? response.results.flatMap((item) => {
		if (!item || typeof item !== "object") return [];
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
