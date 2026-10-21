import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { RecommendationRequestSchema, RecommendationResponseSchema } from "@/schemas/recommendations";
import { generateRecommendations } from "@/services/gemini/recommendations";
import { verifyMovieCandidate } from "@/services/tmdb/verify";
import type { VerifiedMovie } from "@/types/movie";
import type { RecommendationRequest, RecommendationResponse } from "@/types/recommendation";
import { selectBalancedRecommendations, type VerifiedCandidate } from "./ranking";

const MAX_RECOMMENDATION_BATCHES = 2;
const TARGET_COUNT = 5;

function getReleaseYear(movie: VerifiedMovie): number | null {
	const year = /^\d{4}/.exec(movie.releaseDate)?.[0];
	return year ? Number(year) : null;
}

export function matchesHardFilters(movie: VerifiedMovie, request: RecommendationRequest): boolean {
	const { decades, languages } = request.preferences;
	if (decades.length > 0) {
		const year = getReleaseYear(movie);
		if (year === null || !decades.includes(Math.floor(year / 10) * 10)) return false;
	}
	if (languages.length > 0 && !languages.includes(movie.originalLanguage.toLowerCase())) return false;
	return true;
}

function normalizeTitle(title: string): string {
	return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function generateRecommendationResponse(request: RecommendationRequest): Promise<RecommendationResponse> {
	const validRequest = RecommendationRequestSchema.safeParse(request);
	if (!validRequest.success) {
		throw new AppError("INVALID_REQUEST", "The recommendation request is invalid.", 400);
	}

	const verifiedCandidates: VerifiedCandidate[] = [];
	const seenTmdbIds = new Set<number>();
	const seenNormalizedTitles = new Set<string>();

	for (let batch = 0; batch < MAX_RECOMMENDATION_BATCHES; batch += 1) {
		const candidates = await generateRecommendations(validRequest.data);
		for (const candidate of candidates) {
			const candidateKey = normalizeTitle(candidate.title);
			if (!candidateKey || seenNormalizedTitles.has(candidateKey)) continue;
			seenNormalizedTitles.add(candidateKey);

			const movie = await verifyMovieCandidate(candidate);
			if (!movie || seenTmdbIds.has(movie.tmdbId) || !matchesHardFilters(movie, validRequest.data)) continue;
			seenTmdbIds.add(movie.tmdbId);
			verifiedCandidates.push({ candidate, movie });
		}
		if (selectBalancedRecommendations(verifiedCandidates, TARGET_COUNT).length >= TARGET_COUNT) break;
	}

	const selected = selectBalancedRecommendations(verifiedCandidates, TARGET_COUNT);
	if (selected.length !== TARGET_COUNT) {
		logger.error("Recommendation orchestration could not produce enough high-fit filtered movies", {
			category: "INSUFFICIENT_RESULTS",
			verified: verifiedCandidates.length,
			selected: selected.length,
		});
		throw new AppError(
			"INSUFFICIENT_RESULTS",
			"We could not find five strong matches that meet your filters. Try broadening your decades or languages and try again.",
			422,
		);
	}

	const response = {
		personality: validRequest.data.personality,
		recommendations: selected.map(({ candidate, movie }) => ({
			reason: candidate.reason.trim(),
			movie,
		})),
	};
	const parsed = RecommendationResponseSchema.safeParse(response);
	if (!parsed.success) {
		logger.error("Recommendation response failed validation", {
			category: "INVALID_OUTPUT",
			issues: parsed.error.issues.map((issue) => ({ path: issue.path, code: issue.code })),
		});
		throw new AppError("AI_SERVICE_ERROR", "The recommendation service produced an invalid final response.", 502);
	}
	return parsed.data;
}
