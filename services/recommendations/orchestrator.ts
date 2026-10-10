import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
	RecommendationResponseSchema,
	RecommendationRequestSchema,
} from "@/schemas/recommendations";
import { generateRecommendations } from "@/services/gemini/recommendations";
import { verifyMovieCandidate } from "@/services/tmdb/verify";
import type {
	RecommendationRequest,
	RecommendationResponse,
} from "@/types/recommendation";

const MAX_RECOMMENDATION_BATCHES = 2;
const TARGET_COUNT = 5;

export async function generateRecommendationResponse(
	request: RecommendationRequest,
): Promise<RecommendationResponse> {
	const validRequest = RecommendationRequestSchema.safeParse(request);
	if (!validRequest.success) {
		throw new AppError(
			"INVALID_REQUEST",
			"The recommendation request is invalid.",
			400,
		);
	}

	const recommendations: RecommendationResponse["recommendations"] = [];
	const seenTmdbIds = new Set<number>();
	const seenNormalizedTitles = new Set<string>();

	for (let batch = 0; batch < MAX_RECOMMENDATION_BATCHES; batch += 1) {
		const candidates = await generateRecommendations(validRequest.data);
		for (const candidate of candidates) {
			const candidateKey = candidate.title.trim().toLowerCase();
			if (!candidateKey || seenNormalizedTitles.has(candidateKey)) {
				continue;
			}
			seenNormalizedTitles.add(candidateKey);

			const verifiedMovie = await verifyMovieCandidate(candidate);
			if (!verifiedMovie) continue;
			if (seenTmdbIds.has(verifiedMovie.tmdbId)) continue;

			seenTmdbIds.add(verifiedMovie.tmdbId);
			recommendations.push({
				reason: candidate.reason.trim(),
				movie: verifiedMovie,
			});

			if (recommendations.length >= TARGET_COUNT) {
				break;
			}
		}

		if (recommendations.length >= TARGET_COUNT) {
			break;
		}
	}

	if (recommendations.length !== TARGET_COUNT) {
		logger.error("Recommendation orchestration could not produce enough verified movies", {
			category: "INSUFFICIENT_RESULTS",
			produced: recommendations.length,
		});
		throw new AppError(
			"INSUFFICIENT_RESULTS",
			"The recommendation service could not find enough verified movies to complete the result.",
			422,
		);
	}

	const response = {
		personality: validRequest.data.personality,
		recommendations,
	};

	const parsed = RecommendationResponseSchema.safeParse(response);
	if (!parsed.success) {
		logger.error("Recommendation response failed validation", {
			category: "INVALID_OUTPUT",
			issues: parsed.error.issues.map((issue) => ({
				path: issue.path,
				code: issue.code,
			})),
		});
		throw new AppError(
			"AI_SERVICE_ERROR",
			"The recommendation service produced an invalid final response.",
			502,
		);
	}

	return parsed.data;
}
