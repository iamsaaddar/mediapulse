import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
function loader(overrides = {}) {
	const cache = new Map();
	function load(relativePath) {
		const normalized = relativePath.replaceAll("\\", "/"); const absolute = path.resolve(root, normalized);
		if (cache.has(absolute)) return cache.get(absolute).exports;
		const source = fs.readFileSync(absolute, "utf8");
		const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
		const mod = { exports: {} }; cache.set(absolute, mod);
		new Function("require", "module", "exports", js)((name) => {
			if (Object.hasOwn(overrides, name)) return overrides[name];
			if (name === "@/services/tmdb/search") return { searchMovies: async () => [] };
			if (name === "@/services/tmdb/similar") return { getSimilarMovies: async () => ({ items: [], totalPages: 0 }) };
			if (name === "server-only") return {};
			if (name === "zod") return { z };
			if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`);
			if (name.startsWith(".")) return load(`${path.posix.normalize(path.posix.join(path.posix.dirname(normalized), name))}.ts`);
			throw new Error(`Unexpected dependency: ${name}`);
		}, mod, mod.exports);
		return mod.exports;
	}
	return load;
}

const request = { tasteProfile: { signals: [{ dimension: "emotion", value: "dreamlike isolation", confidence: 0.9 }], likes: ["subtle surrealism"], dislikes: ["loud action"] }, preferences: { anchorMovie: "Arrival", vibes: [{ tag: "dreamlike", category: "atmosphere" }], genreIds: [18], decades: [1990], languages: ["fr"] }, confidence: { overall: 0.9 }, personality: { title: "Quiet Dreamer", description: "You favor dreamlike, reflective films." } };
const plan = { lanes: [
	{ strategy: "core_taste", genreNames: ["Drama"], keywordConcepts: ["dreamlike"], languageCodes: ["en"], decades: [2000] },
	{ strategy: "thematic_exploration", genreNames: ["Drama"], keywordConcepts: ["isolation"], languageCodes: ["ja"], decades: [1980] },
	{ strategy: "international_exploration", genreNames: ["Drama"], keywordConcepts: ["identity"], languageCodes: ["es"], decades: [2010] },
	{ strategy: "era_exploration", genreNames: ["Drama"], keywordConcepts: ["memory"], languageCodes: ["it"], decades: [1970] },
] };

test("translation uses only catalog genre IDs and preserves selected genre, decade, and language constraints", () => {
	const service = loader()("services/recommendations/discovery-plan.ts");
	const keywords = new Map([["dreamlike", { id: 420, name: "Dreamlike", query: "dreamlike" }]]);
	const queries = service.createDiscoveryQueries(plan, request, keywords);
	assert.equal(queries.length, 2);
	assert.ok(new Set(queries.flatMap(({ source }) => source.strategies)).size > 1);
	for (const { query } of queries) {
		assert.deepEqual(query.genreIds, [18]);
		assert.deepEqual(query.decades, [1990]);
		assert.deepEqual(query.languages, ["fr"]);
		assert.ok(query.keywordIds.every((id) => id === 420));
		assert.ok(["primary_release_date.asc", "primary_release_date.desc", "original_title.asc"].includes(query.sortBy));
	}
	const allGenres = loader()("constants/movie-genres.ts").TMDB_MOVIE_GENRES.map(({ id }) => id);
	const manyGenreRequest = { ...request, preferences: { ...request.preferences, genreIds: allGenres } };
	const broadGenreQueries = service.createDiscoveryQueries(plan, manyGenreRequest, keywords);
	assert.ok(broadGenreQueries.every(({ query }) => query.genreIds.length === allGenres.length));
});

test("every selected genre is mandatory while movies may contain additional genres", () => {
	const service = loader()("services/recommendations/discovery-plan.ts");
	const multiGenreRequest = { ...request, preferences: { ...request.preferences, genreIds: [18, 10749] } };
	const movieWithBothAndExtra = { genreIds: [18, 10749, 53], releaseDate: "1994-01-01", originalLanguage: "fr" };
	const movieMissingDrama = { ...movieWithBothAndExtra, genreIds: [10749, 53] };
	assert.equal(service.matchesRequestHardFilters(movieWithBothAndExtra, multiGenreRequest), true);
	assert.equal(service.matchesRequestHardFilters(movieMissingDrama, multiGenreRequest), false);
});

test("unresolved keyword concepts do not invent IDs and selected genres still drive discovery", () => {
	const service = loader()("services/recommendations/discovery-plan.ts");
	const emptyResolution = service.createDiscoveryQueries(plan, request, new Map());
	assert.ok(emptyResolution.length > 0);
	assert.ok(emptyResolution.every(({ query }) => query.keywordIds.length === 0));
	const conflictingPlan = { lanes: plan.lanes.map((lane) => ({ ...lane, genreNames: ["Comedy"] })) };
	const conflictQueries = service.createDiscoveryQueries(conflictingPlan, request, new Map());
	assert.ok(conflictQueries.length > 0);
	assert.ok(conflictQueries.every(({ query }) => query.genreIds.length === 1 && query.genreIds[0] === 18));
});

test("mixed keyword resolution keeps only verified concepts while preserving safe alternatives", () => {
	const service = loader()("services/recommendations/discovery-plan.ts");
	const noUserFilters = { ...request, preferences: { ...request.preferences, genreIds: [], decades: [], languages: [] } };
	const mixedPlan = { lanes: [
		{ strategy: "core_taste", genreNames: [], keywordConcepts: ["dreamlike", "unresolved"], languageCodes: [], decades: [] },
		{ strategy: "international_exploration", genreNames: [], keywordConcepts: [], languageCodes: ["fr"], decades: [] },
	] };
	const queries = service.createDiscoveryQueries(mixedPlan, noUserFilters, new Map([
		["dreamlike", { id: 420, name: "Dreamlike", query: "dreamlike" }],
	]));
	assert.deepEqual(queries.map(({ query }) => query.keywordIds), [[420], []]);
	assert.deepEqual(queries.map(({ query }) => query.languages), [[], ["fr"]]);
	assert.ok(queries.every(({ source }) => !source.keywordConcepts.includes("unresolved")));
});

test("effective query deduplication ignores sort differences and merges lane provenance", () => {
	const service = loader()("services/recommendations/discovery-plan.ts");
	const openFilters = { ...request, preferences: { ...request.preferences, genreIds: [], decades: [], languages: [] } };
	const sameSearchPlan = { lanes: [
		{ strategy: "core_taste", genreNames: ["Drama"], keywordConcepts: [], languageCodes: [], decades: [] },
		{ strategy: "era_exploration", genreNames: ["Drama"], keywordConcepts: [], languageCodes: [], decades: [] },
	] };
	const queries = service.createDiscoveryQueries(sameSearchPlan, openFilters, new Map());
	assert.equal(queries.length, 1);
	assert.deepEqual(queries[0].source.strategies, ["core_taste", "era_exploration"]);
});

test("multiple keyword concepts produce separate safe queries; unresolved-only lanes are skipped", () => {
	const service = loader()("services/recommendations/discovery-plan.ts");
	const noUserFilters = { ...request, preferences: { ...request.preferences, genreIds: [], decades: [], languages: [] } };
	const keywordPlan = { lanes: [{ strategy: "core_taste", genreNames: [], keywordConcepts: ["dreamlike", "isolation"], languageCodes: [], decades: [] }] };
	const resolved = new Map([
		["dreamlike", { id: 420, name: "Dreamlike", query: "dreamlike" }],
		["isolation", { id: 421, name: "Isolation", query: "isolation" }],
	]);
	const queries = service.createDiscoveryQueries(keywordPlan, noUserFilters, resolved);
	assert.equal(queries.length, 2);
	assert.deepEqual(queries.map(({ query }) => query.keywordIds), [[420], [421]]);
	const unresolvedOnly = service.createDiscoveryQueries(keywordPlan, noUserFilters, new Map());
	assert.deepEqual(unresolvedOnly, []);
});

test("taste-specific Gemini plans lead to different valid search criteria", async () => {
	const dreamPlan = { lanes: [{ strategy: "core_taste", genreNames: ["Drama"], keywordConcepts: ["dreamlike atmosphere"], languageCodes: [], decades: [] }] };
	const bleakPlan = { lanes: [{ strategy: "core_taste", genreNames: ["Drama"], keywordConcepts: ["bleak isolation"], languageCodes: [], decades: [] }] };
	const prompts = [];
	const recommendationModule = loader({
		"@/services/gemini/client": { getGeminiClient: () => ({ generateStructured: async (prompt) => { prompts.push(prompt); return prompt.includes("bleak isolation") ? bleakPlan : dreamPlan; } }) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	})("services/gemini/recommendations.ts");
	const secondRequest = structuredClone(request);
	secondRequest.tasteProfile.signals[0].value = "bleak isolation and unresolved grief";
	secondRequest.preferences.vibes = [{ tag: "bleak isolation", category: "emotion" }];
	const [firstPlan, secondPlan] = await Promise.all([
		recommendationModule.generateDiscoveryPlan(request),
		recommendationModule.generateDiscoveryPlan(secondRequest),
	]);
	assert.equal(firstPlan.lanes[0].keywordConcepts[0], "dreamlike atmosphere");
	assert.equal(secondPlan.lanes[0].keywordConcepts[0], "bleak isolation");
	assert.ok(prompts[0].includes("dreamlike isolation"));
	assert.ok(prompts[1].includes("bleak isolation and unresolved grief"));
	assert.ok(prompts.every((prompt) => prompt.includes('"overall":0.9') && prompt.includes("Quiet Dreamer")));
	const queryService = loader()("services/recommendations/discovery-plan.ts");
	const firstQueries = queryService.createDiscoveryQueries(firstPlan, request, new Map([["dreamlike atmosphere", { id: 301, name: "Dreamlike Atmosphere", query: "dreamlike atmosphere" }]]));
	const secondQueries = queryService.createDiscoveryQueries(secondPlan, secondRequest, new Map([["bleak isolation", { id: 512, name: "Bleak Isolation", query: "bleak isolation" }]]));
	assert.notDeepEqual(firstQueries.map(({ query }) => query.keywordIds), secondQueries.map(({ query }) => query.keywordIds));
});

test("recommendation discovery and final selection both receive the anchor note", async () => {
	const notedRequest = structuredClone(request);
	notedRequest.preferences.anchorNote = "I want more films adapted from novels, not more supernatural romance.";
	const planOutput = { lanes: [{ strategy: "core_taste", genreNames: ["Drama"], keywordConcepts: ["based on novel"], languageCodes: [], decades: [] }] };
	const prompts = [];
	const service = loader({
		"@/services/gemini/client": { getGeminiClient: () => ({ generateStructured: async (prompt) => {
			prompts.push(prompt);
			return prompt.includes("TMDB CANDIDATE POOL")
				? { selections: Array.from({ length: 7 }, (_, index) => ({ tmdbId: index + 1, reason: "Matches your stated literary preference." })) }
				: planOutput;
		} }) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	})("services/gemini/recommendations.ts");
	await service.generateDiscoveryPlan(notedRequest);
	const pool = Array.from({ length: 7 }, (_, index) => ({ tmdbId: index + 1, title: `Novel Film ${index + 1}`, originalTitle: `Novel Film ${index + 1}`, releaseDate: "1994-01-01", overview: "A film adapted from a novel.", posterPath: null, backdropPath: null, genreIds: [18], originalLanguage: "fr" }));
	await service.selectFinalRecommendations(notedRequest, pool);
	assert.equal(prompts.length, 2);
	assert.ok(prompts.every((prompt) => prompt.includes(notedRequest.preferences.anchorNote)));
	assert.match(prompts[0], /anchorNote.*explicit explanation/i);
});

test("non-contiguous selected decades create separate searches without widening", () => {
	const service = loader()("services/recommendations/discovery-plan.ts");
	const twoDecades = { ...request, preferences: { ...request.preferences, decades: [1980, 2000] } };
	const queries = service.createDiscoveryQueries(plan, twoDecades, new Map());
	const decadeValues = new Set(queries.flatMap(({ query }) => query.decades));
	assert.deepEqual([...decadeValues].sort(), [1980, 2000]);
	assert.ok(queries.every(({ query }) => query.decades.length <= 1));
	const matcher = service.matchesRequestHardFilters;
	assert.equal(matcher({ genreIds: [18], releaseDate: "1994-01-01", originalLanguage: "fr" }, twoDecades), false);
});

test("hard filter matcher rejects conflicting decade, language, or genre metadata", () => {
	const service = loader()("services/recommendations/discovery-plan.ts");
	const base = { genreIds: [18], releaseDate: "1994-01-01", originalLanguage: "fr" };
	assert.equal(service.matchesRequestHardFilters(base, request), true);
	assert.equal(service.matchesRequestHardFilters({ ...base, genreIds: [35] }, request), false);
	assert.equal(service.matchesRequestHardFilters({ ...base, releaseDate: "2001-01-01" }, request), false);
	assert.equal(service.matchesRequestHardFilters({ ...base, originalLanguage: "en" }, request), false);
	assert.equal(service.matchesRequestHardFilters({ ...base, releaseDate: "" }, request), false);
});

test("TMDB keyword resolver accepts exact catalog labels and safely skips missing concepts", () => {
	const keywords = loader({ "@/services/tmdb/client": { fetchTmdb: async () => ({ results: [] }) } })("services/tmdb/keywords.ts");
	assert.equal(keywords.chooseKeywordMatch("dreamlike", [{ id: 1, name: "Dreamlike", query: "dreamlike" }]).id, 1);
	assert.equal(keywords.chooseKeywordMatch("unknown concept", []), null);
	assert.equal(keywords.chooseKeywordMatch("dream", [{ id: 1, name: "Dreamlike", query: "dream" }]), null);
});

test("TMDB keyword searches are cached case-insensitively", async () => {
	let calls = 0;
	const keywords = loader({ "./client": { fetchTmdb: async (path, params) => {
		calls += 1;
		assert.equal(path, "/search/keyword");
		assert.equal(params.page, 1);
		return { results: [{ id: 420, name: "Dreamlike" }] };
	} } })("services/tmdb/keywords.ts");
	const first = await keywords.searchTmdbKeywords("Dreamlike");
	const second = await keywords.searchTmdbKeywords(" dreamlike ");
	assert.equal(calls, 1);
	assert.deepEqual(first, second);
	assert.equal(keywords.chooseKeywordMatch("dreamlike", second).id, 420);
});

test("zero-yield keyword discovery retries without the optional keyword and preserves hard filters", async () => {
	const movies = Array.from({ length: 7 }, (_, index) => ({
		tmdbId: index + 1, title: `Film ${index + 1}`, originalTitle: `Film ${index + 1}`,
		releaseDate: "1994-04-12", overview: "A reflective French drama.", posterPath: null,
		backdropPath: null, genreIds: [18], originalLanguage: "fr",
	}));
	const calls = [];
	const keywordPlan = { lanes: [{ strategy: "core_taste", genreNames: ["Drama"], keywordConcepts: ["dreamlike"], languageCodes: ["en"], decades: [2000] }] };
	const orchestrator = loader({
		"@/services/gemini/recommendations": { generateDiscoveryPlan: async () => keywordPlan, selectFinalRecommendations: async () => [] },
		"@/services/tmdb/keywords": {
			chooseKeywordMatch: (query, results) => results.find((item) => item.name.toLocaleLowerCase() === query.toLocaleLowerCase()) ?? null,
			searchTmdbKeywords: async (query) => [{ id: 420, name: query, query }],
		},
		"@/services/tmdb/discover": { discoverMovies: async (query) => {
			calls.push(query);
			return query.keywordIds.length ? { items: [], totalPages: 0 } : { items: movies, totalPages: 1 };
		} },
		"@/services/tmdb/movie": { getMovieById: async () => ({}) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	})("services/recommendations/orchestrator.ts");

	const result = await orchestrator.gatherEligibleCandidates(request);
	assert.equal(result.requests, 3);
	assert.equal(result.pool.length, 7);
	assert.deepEqual(calls.map(({ keywordIds }) => keywordIds), [[420], []]);
	for (const query of calls) {
		assert.deepEqual(query.genreIds, [18]);
		assert.deepEqual(query.decades, [1990]);
		assert.deepEqual(query.languages, ["fr"]);
	}
	assert.deepEqual(result.provenance.get(1).keywordConcepts, []);
});

test("Gemini final selection accepts seven pool IDs and retries, then rejects IDs outside the pool", async () => {
	const pool = Array.from({ length: 9 }, (_, index) => ({ tmdbId: index + 1, title: `Film ${index + 1}`, originalTitle: `Film ${index + 1}`, releaseDate: "1994-01-01", overview: "Dreamlike reflective drama.", posterPath: null, backdropPath: null, genreIds: [18], originalLanguage: "fr" }));
	const valid = { selections: Array.from({ length: 7 }, (_, index) => ({ tmdbId: index + 1, reason: `Fits your preference ${index + 1}` })) };
	let calls = 0; let capturedPrompt = "";
	let recommendationModule = loader({ "@/services/gemini/client": { getGeminiClient: () => ({ generateStructured: async (prompt) => { calls += 1; capturedPrompt = prompt; return calls === 1 ? { selections: valid.selections.map((item, i) => i === 6 ? { ...item, tmdbId: 1 } : item) } : valid; } }) }, "@/lib/logger": { logger: { info() {}, warn() {}, error() {} } } })("services/gemini/recommendations.ts");
	const selected = await recommendationModule.selectFinalRecommendations(request, pool, new Map([[1, { strategies: ["core_taste"], criteria: ["Drama", "Dreamlike"], keywordConcepts: ["Dreamlike"] }]]));
	assert.equal(selected.length, 7);
	assert.equal(calls, 2);
	assert.ok(selected.every(({ tmdbId }) => pool.some((movie) => movie.tmdbId === tmdbId)));
	const candidateJson = capturedPrompt.split("TMDB CANDIDATE POOL (JSON):\n\n")[1];
	const summaries = JSON.parse(candidateJson);
	assert.equal(summaries.length, pool.length);
	assert.equal("rating" in summaries[0], false);
	assert.equal("voteCount" in summaries[0], false);
	assert.equal("popularity" in summaries[0], false);
	assert.deepEqual(summaries[0].matchedTmdbKeywords, ["Dreamlike"]);

	calls = 0;
	recommendationModule = loader({ "@/services/gemini/client": { getGeminiClient: () => ({ generateStructured: async () => { calls += 1; return { selections: valid.selections.map((item, i) => i === 0 ? { ...item, tmdbId: 900 } : item) }; } }) }, "@/lib/logger": { logger: { info() {}, warn() {}, error() {} } } })("services/gemini/recommendations.ts");
	await assert.rejects(recommendationModule.selectFinalRecommendations(request, pool), { code: "AI_SERVICE_ERROR" });
	assert.equal(calls, 2);
});

test("within-request duplicate candidates merge their discovery provenance", () => {
	const overrides = {
		"@/services/gemini/recommendations": { generateDiscoveryPlan: async () => plan, selectFinalRecommendations: async () => [] },
		"@/services/tmdb/keywords": { chooseKeywordMatch() { return null; }, searchTmdbKeywords: async () => [] },
		"@/services/tmdb/discover": { discoverMovies: async () => ({ items: [], totalPages: 0 }) },
		"@/services/tmdb/movie": { getMovieById: async () => ({}) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	};
	const orchestrator = loader(overrides)("services/recommendations/orchestrator.ts");
	const movie = { tmdbId: 1, title: "Film", originalTitle: "Film", releaseDate: "1994-01-01", overview: "Overview", posterPath: null, backdropPath: null, genreIds: [18], originalLanguage: "fr" };
	const pool = orchestrator.createCandidatePool();
	orchestrator.mergeCandidate(pool, movie, { strategies: ["core_taste"], criteria: ["Drama", "dreamlike"], keywordConcepts: ["Dreamlike"] });
	orchestrator.mergeCandidate(pool, movie, { strategies: ["era_exploration"], criteria: ["Drama", "1990"], keywordConcepts: [] });
	assert.equal(pool.size, 1);
	assert.deepEqual(pool.get(1).provenance, { strategies: ["core_taste", "era_exploration"], criteria: ["Drama", "dreamlike", "1990"], keywordConcepts: ["Dreamlike"] });
});

test("anchor-similarity movies join the candidate pool only when they pass all hard filters", async () => {
	const eligible = { tmdbId: 91, title: "Related French Drama", originalTitle: "Related French Drama", releaseDate: "1994-03-01", overview: "A reflective story.", posterPath: null, backdropPath: null, genreIds: [18], originalLanguage: "fr" };
	const wrongLanguage = { ...eligible, tmdbId: 92, title: "Related English Drama", originalLanguage: "en" };
	const planWithOneQuery = { lanes: [{ strategy: "core_taste", genreNames: ["Drama"], keywordConcepts: [], languageCodes: [], decades: [] }] };
	const orchestrator = loader({
		"@/services/gemini/recommendations": { generateDiscoveryPlan: async () => planWithOneQuery, selectFinalRecommendations: async () => [] },
		"@/services/tmdb/keywords": { chooseKeywordMatch() { return null; }, searchTmdbKeywords: async () => [] },
		"@/services/tmdb/search": { searchMovies: async (title) => title === "Arrival" ? [{ id: 12, title: "Arrival", originalTitle: "Arrival", releaseDate: "2016-11-11" }] : [] },
		"@/services/tmdb/similar": { getSimilarMovies: async (id) => { assert.equal(id, 12); return { items: [eligible, wrongLanguage], totalPages: 1 }; } },
		"@/services/tmdb/discover": { discoverMovies: async () => ({ items: [], totalPages: 0 }) },
		"@/services/tmdb/movie": { getMovieById: async () => ({}) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	})("services/recommendations/orchestrator.ts");
	const result = await orchestrator.gatherEligibleCandidates(request);
	assert.ok(result.pool.some((movie) => movie.tmdbId === 91));
	assert.ok(!result.pool.some((movie) => movie.tmdbId === 92));
	assert.deepEqual(result.provenance.get(91).strategies, ["anchor_similarity"]);
	assert.deepEqual(result.provenance.get(91).criteria, ["similar to anchor: Arrival"]);
});

test("candidate pool cap remains enforced without imposing genre or language quotas", () => {
	const orchestrator = loader({
		"@/services/gemini/recommendations": { generateDiscoveryPlan: async () => plan, selectFinalRecommendations: async () => [] },
		"@/services/tmdb/keywords": { chooseKeywordMatch() { return null; }, searchTmdbKeywords: async () => [] },
		"@/services/tmdb/discover": { discoverMovies: async () => ({ items: [], totalPages: 0 }) },
		"@/services/tmdb/movie": { getMovieById: async () => ({}) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	})("services/recommendations/orchestrator.ts");
	const max = loader()("constants/limits.ts").MAX_DISCOVERY_POOL_SIZE;
	const pool = orchestrator.createCandidatePool();
	for (let id = 1; id <= max + 1; id += 1) {
		orchestrator.mergeCandidate(pool, { tmdbId: id, title: `Film ${id}` }, { strategies: ["core_taste"], criteria: [], keywordConcepts: [] });
	}
	assert.equal(pool.size, max);
	assert.equal(new Set([...pool.values()].map(({ movie }) => movie.tmdbId)).size, max);
});

test("keyword lookup failures and empty query pages end in a clear insufficient-pool error", async () => {
	let discoveryCalls = 0; let selectionCalls = 0;
	const orchestrator = loader({
		"@/services/gemini/recommendations": { generateDiscoveryPlan: async () => plan, selectFinalRecommendations: async () => { selectionCalls += 1; return []; } },
		"@/services/tmdb/keywords": { chooseKeywordMatch() { return null; }, searchTmdbKeywords: async () => { throw new Error("provider unavailable"); } },
		"@/services/tmdb/discover": { discoverMovies: async () => { discoveryCalls += 1; return { items: [], totalPages: 0 }; } },
		"@/services/tmdb/movie": { getMovieById: async () => ({}) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	})("services/recommendations/orchestrator.ts");
	await assert.rejects(orchestrator.generateRecommendationResponse(request), { code: "INSUFFICIENT_RESULTS" });
	assert.ok(discoveryCalls > 0);
	assert.equal(selectionCalls, 0);
});

test("unresolved keyword-only plans fail safely without calling TMDB Discover", async () => {
	let discoveryCalls = 0;
	const noFilters = { ...request, preferences: { ...request.preferences, genreIds: [], decades: [], languages: [] } };
	const keywordOnlyPlan = { lanes: [{ strategy: "core_taste", genreNames: [], keywordConcepts: ["unresolved concept"], languageCodes: [], decades: [] }] };
	const orchestrator = loader({
		"@/services/gemini/recommendations": { generateDiscoveryPlan: async () => keywordOnlyPlan, selectFinalRecommendations: async () => [] },
		"@/services/tmdb/keywords": { chooseKeywordMatch() { return null; }, searchTmdbKeywords: async () => [] },
		"@/services/tmdb/discover": { discoverMovies: async () => { discoveryCalls += 1; return { items: [], totalPages: 0 }; } },
		"@/services/tmdb/movie": { getMovieById: async () => ({}) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	})("services/recommendations/orchestrator.ts");
	await assert.rejects(orchestrator.gatherEligibleCandidates(noFilters), { code: "INSUFFICIENT_RESULTS" });
	assert.equal(discoveryCalls, 0);
});

test("fresh TMDB details are checked against every selected hard filter", async () => {
	const discovered = Array.from({ length: 7 }, (_, index) => ({ tmdbId: index + 1, title: `Film ${index + 1}`, originalTitle: `Film ${index + 1}`, releaseDate: "1994-04-12", overview: "A reflective French drama.", posterPath: null, backdropPath: null, genreIds: [18], originalLanguage: "fr" }));
	const orchestrator = loader({
		"@/services/gemini/recommendations": {
			generateDiscoveryPlan: async () => ({ lanes: [plan.lanes[0]] }),
			selectFinalRecommendations: async () => discovered.map(({ tmdbId }) => ({ tmdbId, reason: "Matches your reflective taste." })),
		},
		"@/services/tmdb/keywords": { chooseKeywordMatch() { return null; }, searchTmdbKeywords: async () => [] },
		"@/services/tmdb/discover": { discoverMovies: async () => ({ items: discovered, totalPages: 1 }) },
		"@/services/tmdb/movie": { getMovieById: async (id) => ({
			id, title: `Film ${id}`, originalTitle: `Film ${id}`, releaseDate: "1994-04-12", overview: "A reflective French drama.", posterPath: null, backdropPath: null,
			rating: 0, voteCount: 0, genreIds: [18], originalLanguage: id === 1 ? "en" : "fr",
		}) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	}) ("services/recommendations/orchestrator.ts");
	await assert.rejects(orchestrator.generateRecommendationResponse(request), { code: "MOVIE_DATA_ERROR" });
});

test("candidate expansion pages complementary lanes within the shared request cap", async () => {
	let nextId = 1; const pagesByQuery = new Map();
	const orchestrator = loader({
		"@/services/gemini/recommendations": { generateDiscoveryPlan: async () => plan, selectFinalRecommendations: async () => [] },
		"@/services/tmdb/keywords": { chooseKeywordMatch: (query, results) => results.find((item) => item.name === query) ?? null, searchTmdbKeywords: async (query) => [{ id: query.length + query.charCodeAt(0), name: query, query }] },
		"@/services/tmdb/discover": { discoverMovies: async (query) => {
			const key = JSON.stringify({ ...query, page: undefined });
			pagesByQuery.set(key, Math.max(query.page, pagesByQuery.get(key) ?? 0));
			const id = nextId++;
			return { items: [{ tmdbId: id, title: `Film ${id}`, originalTitle: `Film ${id}`, releaseDate: "1994-04-12", overview: "Dreamlike French drama.", posterPath: null, backdropPath: null, genreIds: [18], originalLanguage: "fr" }], totalPages: 40 };
		} },
		"@/services/tmdb/movie": { getMovieById: async () => ({}) },
		"@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
	})("services/recommendations/orchestrator.ts");
	const result = await orchestrator.gatherEligibleCandidates(request);
	assert.equal(result.requests, 24);
	assert.equal(result.pool.length, 23);
	assert.ok(result.provenance.size === result.pool.length);
	assert.ok(pagesByQuery.size > 1);
	assert.ok([...pagesByQuery.values()].every((page) => page <= 6));
	assert.ok(result.pool.every((movie) => movie.genreIds.includes(18) && movie.releaseDate.startsWith("1994") && movie.originalLanguage === "fr"));
});

test("insufficient pools fail honestly instead of asking Gemini to invent replacements", async () => {
	let calls = 0;
	const service = loader({ "@/services/gemini/client": { getGeminiClient: () => ({ generateStructured: async () => { calls += 1; return {}; } }) }, "@/lib/logger": { logger: { info() {}, warn() {}, error() {} } } })("services/gemini/recommendations.ts");
	await assert.rejects(service.selectFinalRecommendations(request, Array.from({ length: 6 }, (_, index) => ({ tmdbId: index + 1 }))), { code: "INSUFFICIENT_RESULTS" });
	assert.equal(calls, 0);
});

test("candidate discovery and request limits bound expansion", () => {
	const limits = loader()("constants/limits.ts");
	assert.ok(limits.TARGET_DISCOVERY_POOL_SIZE >= 100);
	assert.ok(limits.MAX_DISCOVERY_POOL_SIZE <= 200);
	assert.ok(limits.MAX_DISCOVERY_REQUESTS <= 24);
	assert.ok(limits.MAX_DISCOVERY_PAGES <= 6);
	assert.ok(limits.MAX_SELECTION_RETRIES <= 1);
});
