import { getEnv } from "@/lib/env";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export function getTmdbConfig() {
	const { TMDB_API_KEY } = getEnv();

	return {
		apiKey: TMDB_API_KEY,
		baseUrl: TMDB_BASE_URL,
	};
}
