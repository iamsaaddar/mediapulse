import { VerifiedMovieSchema } from "@/schemas/movie";
import type { RecommendationCandidate } from "@/types/recommendation";
import type { VerifiedMovie } from "@/types/movie";

import { getMovieById, type TmdbMovieDetails } from "./movie";
import { searchMovies, type TmdbSearchResult } from "./search";

function normalizeTitle(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\b(the|a|an)\b/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function titleSimilarity(left: string, right: string): number {
	const a = normalizeTitle(left);
	const b = normalizeTitle(right);
	if (!a || !b) return 0;
	if (a === b) return 1;
	if (a.includes(b) || b.includes(a)) return 0.9;

	const aWords = a.split(" ").filter(Boolean);
	const bWords = b.split(" ").filter(Boolean);
	if (aWords.length === 0 || bWords.length === 0) return 0;

	const sharedWords = aWords.filter((word) => bWords.includes(word));
	const unionWords = new Set([...aWords, ...bWords]);
	return unionWords.size === 0 ? 0 : sharedWords.length / unionWords.size;
}

function extractYearFromDate(value: string): number | null {
	if (!value) return null;
	const match = /^\d{4}/.exec(value);
	if (!match) return null;
	return Number.parseInt(match[0], 10);
}

function candidateMatchesResult(
	candidate: RecommendationCandidate,
	result: TmdbSearchResult,
): { score: number; accepted: boolean } {
	const candidateTitle = normalizeTitle(candidate.title);
	const resultTitle = normalizeTitle(result.title);
	const originalTitle = normalizeTitle(result.originalTitle);

	let score = 0;
	if (candidateTitle === resultTitle || candidateTitle === originalTitle) {
		score += 0.8;
	}
	if (resultTitle.includes(candidateTitle) || candidateTitle.includes(resultTitle)) {
		score += 0.1;
	}
	const similarity = titleSimilarity(candidate.title, result.title);
	score += similarity * 0.5;

	if (candidate.year !== null && candidate.year !== undefined) {
		const searchYear = extractYearFromDate(result.releaseDate);
		if (searchYear !== null && searchYear !== candidate.year) {
			return { score: 0, accepted: false };
		}
		if (searchYear !== null) {
			score += 0.2;
		}
	}

	const accepted = score >= 0.75 && (candidateTitle.length > 0 || resultTitle.length > 0);
	return { score, accepted };
}

function pickBestMatch(
	candidate: RecommendationCandidate,
	results: TmdbSearchResult[],
): TmdbSearchResult | null {
	const scored = results
		.map((result) => ({
			result,
			...candidateMatchesResult(candidate, result),
		}))
		.filter((entry) => entry.accepted)
		.sort((left, right) => right.score - left.score);

	if (scored.length === 0) return null;
	const bestScore = scored[0].score;
	const tied = scored.filter((entry) => Math.abs(entry.score - bestScore) < 0.02);
	if (tied.length > 1) return null;
	return scored[0].result;
}

function toVerifiedMovie(details: TmdbMovieDetails): VerifiedMovie {
	const parsed = VerifiedMovieSchema.safeParse({
		tmdbId: details.id,
		title: details.title,
		originalTitle: details.originalTitle,
		releaseDate: details.releaseDate,
		overview: details.overview,
		posterPath: details.posterPath,
		backdropPath: details.backdropPath,
		rating: details.rating,
		voteCount: details.voteCount,
		genreIds: details.genreIds,
		originalLanguage: details.originalLanguage,
	});

	if (!parsed.success) {
		throw new Error("TMDB details failed application validation.");
	}
	return parsed.data;
}

export async function verifyMovieCandidate(
	candidate: RecommendationCandidate,
): Promise<VerifiedMovie | null> {
	const trimmedTitle = candidate.title.trim();
	if (!trimmedTitle || candidate.reason.trim().length === 0) {
		return null;
	}

	const searchResults = await searchMovies(trimmedTitle, candidate.year ?? null);
	if (searchResults.length === 0) {
		return null;
	}

	const matched = pickBestMatch(candidate, searchResults);
	if (!matched) {
		return null;
	}

	const details = await getMovieById(matched.id);
	if (details.id !== matched.id) {
		return null;
	}
	if (candidate.year !== null && candidate.year !== undefined) {
		const detailsYear = extractYearFromDate(details.releaseDate);
		if (detailsYear !== null && detailsYear !== candidate.year) {
			return null;
		}
	}

	try {
		return toVerifiedMovie(details);
	} catch {
		return null;
	}
}
