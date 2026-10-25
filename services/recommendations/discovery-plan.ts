import { MAX_DISCOVERY_LANES, MAX_DISCOVERY_REQUESTS, MAX_KEYWORD_CONCEPTS } from "@/constants/limits";
import { TMDB_MOVIE_GENRES } from "@/constants/movie-genres";
import type { RecommendationRequest } from "@/types/recommendation";
import type { DiscoveryPlan } from "@/schemas/discovery";
import type { ResolvedKeyword } from "@/services/tmdb/keywords";
import type { TmdbDiscoverQuery } from "@/services/tmdb/discover";

export interface DiscoveryLaneSource { strategies: string[]; criteria: string[]; keywordConcepts: string[] }
export type CandidateProvenance = DiscoveryLaneSource;
export interface PlannedDiscoveryQuery { query: TmdbDiscoverQuery; source: DiscoveryLaneSource }

function sortForStrategy(strategy: string): TmdbDiscoverQuery["sortBy"] {
	switch (strategy) {
		case "era_exploration": return "primary_release_date.asc";
		case "international_exploration": return "original_title.asc";
		case "thematic_exploration": return "primary_release_date.desc";
		default: return "original_title.asc";
	}
}

function effectiveQueryKey(query: TmdbDiscoverQuery): string {
	return JSON.stringify({
		genreIds: [...query.genreIds].sort((a, b) => a - b),
		keywordIds: [...query.keywordIds].sort((a, b) => a - b),
		decades: [...query.decades].sort((a, b) => a - b),
		languages: [...query.languages].sort(),
	});
}

function mergeSource(target: DiscoveryLaneSource, strategy: string, criteria: string[], keywordConcepts: string[]): void {
	target.strategies = [...new Set([...target.strategies, strategy])];
	target.criteria = [...new Set([...target.criteria, ...criteria])];
	target.keywordConcepts = [...new Set([...target.keywordConcepts, ...keywordConcepts])];
}

export function createDiscoveryQueries(
	plan: DiscoveryPlan,
	request: RecommendationRequest,
	resolvedKeywords: Map<string, ResolvedKeyword>,
): PlannedDiscoveryQuery[] {
	const queriesByKey = new Map<string, PlannedDiscoveryQuery>();
	const queryGroups: PlannedDiscoveryQuery[][] = [];
	const selectedGenres = request.preferences.genreIds;
	const selectedDecades = request.preferences.decades;
	const selectedLanguages = request.preferences.languages;

	for (const lane of plan.lanes.slice(0, MAX_DISCOVERY_LANES)) {
		const laneQueries: PlannedDiscoveryQuery[] = [];
		const laneGenres = lane.genreNames.flatMap((name) => {
			const genre = TMDB_MOVIE_GENRES.find((item) => item.name === name);
			return genre ? [genre.id] : [];
		});
		// User-selected genres are all required. TMDB receives them as an AND set;
		// Gemini's exploratory genre suggestions cannot replace or narrow that set.
		const genreIds = selectedGenres.length ? [...selectedGenres] : laneGenres;
		const decades = selectedDecades.length ? selectedDecades : lane.decades;
		const languages = selectedLanguages.length ? selectedLanguages : lane.languageCodes;
		const keywordIds = [...new Set(lane.keywordConcepts.flatMap((concept) => {
			const keyword = resolvedKeywords.get(concept.toLocaleLowerCase());
			return keyword ? [keyword.id] : [];
		}))].slice(0, 5);
		const keywordAlternatives: Array<number[]> = keywordIds.length ? keywordIds.map((id) => [id]) : [[]];
		const decadeAlternatives: Array<number[]> = decades.length ? decades.map((decade) => [decade]) : [[]];
		const languageAlternatives: Array<string[]> = languages.length ? languages.map((language) => [language]) : [[]];

		for (const keywordGroup of keywordAlternatives) {
			for (const decadeGroup of decadeAlternatives) {
				for (const languageGroup of languageAlternatives) {
					// A query is safe only if at least one supported filter survived plan
					// validation and TMDB keyword resolution.
					if (!genreIds.length && !keywordGroup.length && !decadeGroup.length && !languageGroup.length) continue;
					const query: TmdbDiscoverQuery = {
						genreIds, keywordIds: keywordGroup, decades: decadeGroup,
						languages: languageGroup, page: 1, sortBy: sortForStrategy(lane.strategy),
					};
					const criteria = [
						...genreIds.map((id) => TMDB_MOVIE_GENRES.find((item) => item.id === id)?.name ?? String(id)),
						...keywordGroup.map((id) => [...resolvedKeywords.values()].find((keyword) => keyword.id === id)?.name ?? `keyword:${id}`),
						...decadeGroup.map(String), ...languageGroup,
					];
					const keywordConcepts = keywordGroup.map((id) => [...resolvedKeywords.values()].find((keyword) => keyword.id === id)?.name).filter((name): name is string => Boolean(name));
					const key = effectiveQueryKey(query);
					const existing = queriesByKey.get(key);
					if (existing) {
						mergeSource(existing.source, lane.strategy, criteria, keywordConcepts);
						continue;
					}
					const planned = { query, source: { strategies: [lane.strategy], criteria: [...new Set(criteria)], keywordConcepts } };
					queriesByKey.set(key, planned);
					laneQueries.push(planned);
				}
			}
		}
		if (laneQueries.length) queryGroups.push(laneQueries);
	}

	// Round-robin distinct criteria sets across lanes. Sort order is attached to
	// each query but never creates a second query for otherwise identical filters.
	const queries: PlannedDiscoveryQuery[] = [];
	for (let depth = 0; depth < MAX_DISCOVERY_REQUESTS; depth += 1) {
		for (const group of queryGroups) {
			const query = group[depth];
			if (query) queries.push(query);
			if (queries.length >= MAX_DISCOVERY_REQUESTS) return queries;
		}
	}
	return queries;
}

export function collectKeywordConcepts(plan: DiscoveryPlan): string[] {
	const concepts = new Map<string, string>();
	for (const lane of plan.lanes) for (const concept of lane.keywordConcepts) {
		const key = concept.trim().toLocaleLowerCase();
		if (key && !concepts.has(key)) concepts.set(key, concept.trim());
	}
	return [...concepts.values()].slice(0, MAX_KEYWORD_CONCEPTS);
}

export function matchesRequestHardFilters(movie: { genreIds: number[]; releaseDate: string; originalLanguage: string }, request: RecommendationRequest): boolean {
	const { genreIds, decades, languages } = request.preferences;
	if (genreIds.length && !genreIds.every((id) => movie.genreIds.includes(id))) return false;
	if (languages.length && !languages.includes(movie.originalLanguage.toLowerCase())) return false;
	if (decades.length) {
		const year = Number(/^\d{4}/.exec(movie.releaseDate)?.[0]);
		if (!Number.isFinite(year) || !decades.includes(Math.floor(year / 10) * 10)) return false;
	}
	return true;
}
