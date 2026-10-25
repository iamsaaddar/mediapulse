import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { MAX_DISCOVERY_PAGES, MAX_DISCOVERY_POOL_SIZE, MAX_DISCOVERY_REQUESTS, TARGET_DISCOVERY_POOL_SIZE } from "@/constants/limits";
import { RecommendationRequestSchema, RecommendationResponseSchema } from "@/schemas/recommendations";
import { VerifiedMovieSchema } from "@/schemas/movie";
import { generateDiscoveryPlan, selectFinalRecommendations } from "@/services/gemini/recommendations";
import { chooseKeywordMatch, searchTmdbKeywords, type ResolvedKeyword } from "@/services/tmdb/keywords";
import { discoverMovies } from "@/services/tmdb/discover";
import { getMovieById } from "@/services/tmdb/movie";
import type { DiscoveredMovie, VerifiedMovie } from "@/types/movie";
import type { RecommendationRequest, RecommendationResponse } from "@/types/recommendation";
import { collectKeywordConcepts, createDiscoveryQueries, matchesRequestHardFilters, type CandidateProvenance } from "./discovery-plan";

export function createCandidatePool() {
	return new Map<number, { movie: DiscoveredMovie; provenance: CandidateProvenance }>();
}

export function mergeCandidate(
	pool: ReturnType<typeof createCandidatePool>,
	movie: DiscoveredMovie,
	source: CandidateProvenance,
): void {
	const existing = pool.get(movie.tmdbId);
	if (existing) {
		existing.provenance.strategies = [...new Set([...existing.provenance.strategies, ...source.strategies])];
		existing.provenance.criteria = [...new Set([...existing.provenance.criteria, ...source.criteria])];
		existing.provenance.keywordConcepts = [...new Set([...existing.provenance.keywordConcepts, ...source.keywordConcepts])];
		return;
	}
	if (pool.size < MAX_DISCOVERY_POOL_SIZE) pool.set(movie.tmdbId, { movie, provenance: { strategies: [...source.strategies], criteria: [...source.criteria], keywordConcepts: [...source.keywordConcepts] } });
}

function toVerifiedMovie(details: Awaited<ReturnType<typeof getMovieById>>): VerifiedMovie {
	const parsed = VerifiedMovieSchema.safeParse({
		tmdbId: details.id, title: details.title, originalTitle: details.originalTitle,
		releaseDate: details.releaseDate, overview: details.overview, posterPath: details.posterPath,
		backdropPath: details.backdropPath, rating: details.rating, voteCount: details.voteCount,
		genreIds: details.genreIds, originalLanguage: details.originalLanguage,
	});
	if (!parsed.success) throw new AppError("MOVIE_DATA_ERROR", "TMDB returned incomplete movie details.", 502);
	return parsed.data;
}

async function resolveKeywords(concepts: string[]): Promise<Map<string, ResolvedKeyword>> {
	const resolved = new Map<string, ResolvedKeyword>();
	for (const concept of concepts) {
		try {
			const match = chooseKeywordMatch(concept, await searchTmdbKeywords(concept));
			if (match) resolved.set(concept.toLocaleLowerCase(), match);
		} catch {
			logger.warn("TMDB keyword concept could not be resolved; discovery will continue without it", { category: "KEYWORD_RESOLUTION" });
		}
	}
	return resolved;
}

export async function gatherEligibleCandidates(request: RecommendationRequest) {
	const plan = await generateDiscoveryPlan(request);
	const concepts = collectKeywordConcepts(plan);
	const keywords = await resolveKeywords(concepts);
	const planned = createDiscoveryQueries(plan, request, keywords);
	if (!planned.length) throw new AppError("INSUFFICIENT_RESULTS", "No safe TMDB search could be built from this taste profile and its filters.", 422);

	const pool = createCandidatePool();
	const active = planned.map(({ query, source }) => ({ query, source, page: 1, lastPage: MAX_DISCOVERY_PAGES }));
	let requests = 0;
	let turn = 0;
	while (requests < MAX_DISCOVERY_REQUESTS && pool.size < TARGET_DISCOVERY_POOL_SIZE && pool.size < MAX_DISCOVERY_POOL_SIZE && active.length) {
		const index = turn % active.length;
		const lane = active[index];
		if (lane.page > lane.lastPage) { active.splice(index, 1); continue; }
		turn = index + 1;
		try {
			const result = await discoverMovies({ ...lane.query, page: lane.page });
			requests += 1;
			lane.lastPage = Math.min(lane.lastPage, result.totalPages || lane.page);
			for (const movie of result.items) {
				if (!matchesRequestHardFilters(movie, request)) continue;
				mergeCandidate(pool, movie, lane.source);
			}
			lane.page += 1;
		} catch (error) {
			requests += 1;
			logger.warn("A TMDB discovery lane failed; other bounded lanes will continue", { category: error instanceof AppError ? error.code : "TMDB_DISCOVERY", strategies: lane.source.strategies });
			active.splice(index, 1);
			if (error instanceof AppError && error.code === "RATE_LIMITED") break;
		}
	}
	logger.info("TMDB discovery pool prepared", { category: "DISCOVERY_COMPLETE", candidates: pool.size, requests, plannedQueries: planned.length, keywordConcepts: concepts.length, resolvedKeywords: keywords.size });
	return { pool: [...pool.values()].map(({ movie }) => movie), provenance: new Map([...pool].map(([id, value]) => [id, value.provenance])), plan, requests };
}

export async function generateRecommendationResponse(request: RecommendationRequest): Promise<RecommendationResponse> {
	const validRequest = RecommendationRequestSchema.safeParse(request);
	if (!validRequest.success) throw new AppError("INVALID_REQUEST", "The recommendation request is invalid.", 400);
	const data = validRequest.data;
	const { pool, provenance, requests } = await gatherEligibleCandidates(data);
	if (pool.length < 7) {
		logger.warn("Discovery ended with fewer than seven eligible candidates within request limits", { category: "INSUFFICIENT_RESULTS", candidateCount: pool.length, requests });
		throw new AppError("INSUFFICIENT_RESULTS", "We could not find seven eligible movies that meet your filters. Try broadening your genres, decades, or languages.", 422);
	}
	const selections = await selectFinalRecommendations(data, pool, provenance);
	const poolById = new Map(pool.map((movie) => [movie.tmdbId, movie]));
	const recommendations = await Promise.all(selections.map(async ({ tmdbId, reason }) => {
		const candidate = poolById.get(tmdbId);
		if (!candidate) throw new AppError("AI_SERVICE_ERROR", "The recommendation service selected a movie outside the candidate pool.", 502);
		const details = toVerifiedMovie(await getMovieById(tmdbId));
		if (details.tmdbId !== tmdbId || !matchesRequestHardFilters(details, data)) {
			throw new AppError("MOVIE_DATA_ERROR", "TMDB movie details did not satisfy the selected filters.", 502);
		}
		const sources = provenance.get(tmdbId);
		logger.info("TMDB candidate selected by Gemini", { category: "RECOMMENDATION_SELECTED", tmdbId, sourceStrategies: sources?.strategies ?? [], matchedCriteria: sources?.criteria ?? [], matchedKeywordConcepts: sources?.keywordConcepts ?? [] });
		return { reason: reason.trim(), movie: details };
	}));
	const parsed = RecommendationResponseSchema.safeParse({ personality: data.personality, recommendations });
	if (!parsed.success) throw new AppError("AI_SERVICE_ERROR", "The recommendation service produced an invalid final response.", 502);
	return parsed.data;
}
