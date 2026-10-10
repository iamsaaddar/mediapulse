import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export function getTmdbConfig() {
	const { TMDB_API_KEY } = getEnv();

	return {
		apiKey: TMDB_API_KEY,
		baseUrl: TMDB_BASE_URL,
	};
}

export async function fetchTmdb<T>(
	path: string,
	params: Record<string, string | number | undefined | null> = {},
): Promise<T> {
	const { apiKey, baseUrl } = getTmdbConfig();
	const url = new URL(`${baseUrl}${path}`);

	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === "") continue;
		url.searchParams.set(key, String(value));
	}
	url.searchParams.set("api_key", apiKey);

	let response: Response;
	try {
		response = await fetch(url, {
			headers: {
				accept: "application/json",
			},
		});
	} catch (error) {
		logger.error("TMDB request failed to reach the provider", {
			category: "NETWORK_ERROR",
			path,
			cause: error instanceof Error ? error.name : String(error),
		});
		throw new AppError(
			"MOVIE_DATA_ERROR",
			"The movie data provider is temporarily unavailable.",
			503,
		);
	}

	if (response.status === 429) {
		throw new AppError(
			"RATE_LIMITED",
			"The movie data provider is rate-limited. Please try again shortly.",
			429,
		);
	}

	if (response.status === 401 || response.status === 403) {
		throw new AppError(
			"MOVIE_DATA_ERROR",
			"The movie data provider is not configured correctly.",
			502,
		);
	}

	if (!response.ok) {
		throw new AppError(
			"MOVIE_DATA_ERROR",
			"The movie data provider could not complete the request.",
			response.status >= 500 ? 502 : 400,
		);
	}

	const text = await response.text();
	if (!text) {
		throw new AppError(
			"MOVIE_DATA_ERROR",
			"The movie data provider returned an empty response.",
			502,
		);
	}

	try {
		return JSON.parse(text) as T;
	} catch (error) {
		logger.error("TMDB response was invalid JSON", {
			category: "INVALID_RESPONSE",
			path,
			cause: error instanceof Error ? error.message : String(error),
		});
		throw new AppError(
			"MOVIE_DATA_ERROR",
			"The movie data provider returned invalid response data.",
			502,
		);
	}
}
