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
	_tmdbId: number,
): Promise<TmdbMovieDetails> {
	throw new Error("TMDB movie details are not implemented yet.");
}
