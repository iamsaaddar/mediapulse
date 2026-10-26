import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { MAX_DISCOVERY_PAGES, MAX_DISCOVERY_POOL_SIZE, MAX_DISCOVERY_REQUESTS, TARGET_DISCOVERY_POOL_SIZE } from "@/constants/limits";
import { RecommendationRequestSchema, RecommendationResponseSchema } from "@/schemas/recommendations";
import { VerifiedMovieSchema } from "@/schemas/movie";
import { generateDiscoveryPlan, selectFinalRecommendations } from "@/services/gemini/recommendations";
import { chooseKeywordMatch, searchTmdbKeywords, type ResolvedKeyword } from "@/services/tmdb/keywords";
import { discoverMovies } from "@/services/tmdb/discover";
import { getMovieById } from "@/services/tmdb/movie";
import { searchMovies } from "@/services/tmdb/search";
import { getSimilarMovies } from "@/services/tmdb/similar";
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

function discoveryQueryKey(query: { genreIds: number[]; keywordIds: number[]; decades: number[]; languages: string[] }): string {
	return JSON.stringify({
		genreIds: [...query.genreIds].sort((a, b) => a - b),
		keywordIds: [...query.keywordIds].sort((a, b) => a - b),
		decades: [...query.decades].sort((a, b) => a - b),
		languages: [...query.languages].sort(),
	});
}

function normalizeMovieTitle(value: string): string {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
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
	const scheduledQueryKeys = new Set(planned.map(({ query }) => discoveryQueryKey(query)));
	let requests = 0;
	// The anchor is an additional candidate source, not a replacement for the
	// taste-profile searches. Reserve its API calls from the same request budget.
	try {
		requests += 1;
		const anchorQuery = normalizeMovieTitle(request.preferences.anchorMovie);
		const anchorMatches = await searchMovies(request.preferences.anchorMovie);
		const anchor = anchorMatches.find((movie) => normalizeMovieTitle(movie.title) === anchorQuery || normalizeMovieTitle(movie.originalTitle) === anchorQuery);
		if (anchor) {
			requests += 1;
			const similar = await getSimilarMovies(anchor.id);
			let eligible = 0;
			let added = 0;
			for (const movie of similar.items) {
				if (!matchesRequestHardFilters(movie, request)) continue;
				eligible += 1;
				const existed = pool.has(movie.tmdbId);
				mergeCandidate(pool, movie, {
					strategies: ["anchor_similarity"],
					criteria: [`similar to anchor: ${anchor.title}`],
					keywordConcepts: [],
				});
				if (!existed && pool.has(movie.tmdbId)) added += 1;
			}
			logger.info("Anchor-movie similarity candidates processed", {
				category: "ANCHOR_SIMILARITY",
				anchorTmdbId: anchor.id,
				anchorTitle: anchor.title,
				resultsReturned: similar.items.length,
				passedHardFilters: eligible,
				newUniqueCandidates: added,
				poolSizeAfter: pool.size,
			});
		} else {
			logger.info("Anchor movie could not be matched exactly in TMDB; continuing with taste-profile discovery", { category: "ANCHOR_SIMILARITY_SKIPPED" });
		}
	} catch (error) {
		logger.warn("Anchor similarity discovery failed; continuing with taste-profile discovery", {
			category: "ANCHOR_SIMILARITY_FAILED",
			code: error instanceof AppError ? error.code : "TMDB_SIMILARITY",
		});
	}
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
			const poolSizeBefore = pool.size;
			let passedHardFilters = 0;
			let newUniqueCandidates = 0;
			let duplicateCandidates = 0;
			let poolCapacityDrops = 0;
			for (const movie of result.items) {
				if (!matchesRequestHardFilters(movie, request)) continue;
				passedHardFilters += 1;
				if (pool.has(movie.tmdbId)) duplicateCandidates += 1;
				else if (pool.size >= MAX_DISCOVERY_POOL_SIZE) {
					poolCapacityDrops += 1;
					continue;
				} else newUniqueCandidates += 1;
				mergeCandidate(pool, movie, lane.source);
			}
			logger.info("TMDB discovery query completed", {
				category: "DISCOVERY_QUERY",
				requestNumber: requests,
				page: lane.page,
				strategies: lane.source.strategies,
				criteria: lane.source.criteria,
				keywordConcepts: lane.source.keywordConcepts,
				filters: { genreIds: lane.query.genreIds, keywordIds: lane.query.keywordIds, decades: lane.query.decades, languages: lane.query.languages, sortBy: lane.query.sortBy },
				resultsReturned: result.items.length,
				passedHardFilters,
				newUniqueCandidates,
				duplicateCandidates,
				poolCapacityDrops,
				poolSizeBefore,
				poolSizeAfter: pool.size,
				totalPages: result.totalPages,
			});
			if (lane.query.keywordIds.length && passedHardFilters === 0) {
				const fallbackQuery = { ...lane.query, keywordIds: [], page: 1 };
				const fallbackKey = discoveryQueryKey(fallbackQuery);
				if (!scheduledQueryKeys.has(fallbackKey) && requests < MAX_DISCOVERY_REQUESTS) {
					scheduledQueryKeys.add(fallbackKey);
					const fallbackKeywordNames = new Set(lane.source.keywordConcepts.map((concept) => concept.toLocaleLowerCase()));
					active.push({
						query: fallbackQuery,
						source: {
							strategies: [...lane.source.strategies],
							criteria: lane.source.criteria.filter((criterion) => !fallbackKeywordNames.has(criterion.toLocaleLowerCase())),
							keywordConcepts: [],
						},
						page: 1,
						lastPage: MAX_DISCOVERY_PAGES,
					});
					logger.info("Queued broader TMDB discovery fallback after a zero-yield keyword query", {
						category: "DISCOVERY_FALLBACK_QUEUED",
						keywordIds: lane.query.keywordIds,
						preservedFilters: { genreIds: fallbackQuery.genreIds, decades: fallbackQuery.decades, languages: fallbackQuery.languages },
					});
				}
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
