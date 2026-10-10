import { fetchTmdb } from "./client";

export interface TmdbMovieDetails {
	id: number;
	title: string;
	originalTitle: string;
	releaseDate: string;
	overview: string;
	posterPath: string | null;
	backdropPath: string | null;
	rating: number;
	voteCount: number;
	genreIds: number[];
	originalLanguage: string;
}

export async function getMovieById(
	tmdbId: number,
): Promise<TmdbMovieDetails> {
	const response = await fetchTmdb<{
		id?: number;
		title?: string;
		original_title?: string;
		release_date?: string | null;
		overview?: string | null;
		poster_path?: string | null;
		backdrop_path?: string | null;
		vote_average?: number;
		vote_count?: number;
		genres?: Array<{ id?: number }>;
		original_language?: string | null;
	}>(`/movie/${tmdbId}`);

	if (typeof response.id !== "number") {
		throw new Error("TMDB details response did not include a valid movie ID.");
	}

	return {
		id: response.id,
		title: typeof response.title === "string" ? response.title : "",
		originalTitle:
			typeof response.original_title === "string" ? response.original_title : "",
		releaseDate:
			typeof response.release_date === "string" ? response.release_date : "",
		overview: typeof response.overview === "string" ? response.overview : "",
		posterPath:
			typeof response.poster_path === "string" ? response.poster_path : null,
		backdropPath:
			typeof response.backdrop_path === "string" ? response.backdrop_path : null,
		rating: typeof response.vote_average === "number" ? response.vote_average : 0,
		voteCount:
			typeof response.vote_count === "number" ? response.vote_count : 0,
		genreIds: Array.isArray(response.genres)
			? response.genres
				.filter((genre) => genre && typeof genre.id === "number")
				.map((genre) => genre.id as number)
			: [],
		originalLanguage:
			typeof response.original_language === "string"
				? response.original_language
				: "",
	};
}
