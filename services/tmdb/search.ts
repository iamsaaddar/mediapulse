import { AppError } from "@/lib/errors";

import { fetchTmdb } from "./client";

export interface TmdbSearchResult {
	id: number;
	title: string;
	originalTitle: string;
	releaseDate: string;
}

export async function searchMovies(
	title: string,
	year?: number | null,
): Promise<TmdbSearchResult[]> {
	const normalizedTitle = title.trim();
	if (!normalizedTitle) {
		throw new AppError(
			"INVALID_REQUEST",
			"A movie search requires a non-empty title.",
			400,
		);
	}

	const response = await fetchTmdb<{ results?: Array<{
		id?: number;
		title?: string;
		original_title?: string;
		release_date?: string | null;
	}> }>("/search/movie", {
		query: normalizedTitle,
		include_adult: "false",
		language: "en-US",
		primary_release_year: year ?? undefined,
	});

	if (!Array.isArray(response.results)) {
		return [];
	}

	return response.results
		.filter((item) => item && typeof item.id === "number")
		.map((item) => ({
			id: item.id as number,
			title: typeof item.title === "string" ? item.title : "",
			originalTitle:
				typeof item.original_title === "string" ? item.original_title : "",
			releaseDate: typeof item.release_date === "string" ? item.release_date : "",
		}))
		.filter((item) => item.title || item.originalTitle);
}
