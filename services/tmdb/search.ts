export interface TmdbSearchResult {
	id: number;
	title: string;
	originalTitle: string;
	releaseDate: string;
}

export async function searchMovies(
	_title: string,
): Promise<TmdbSearchResult[]> {
	throw new Error("TMDB movie search is not implemented yet.");
}
