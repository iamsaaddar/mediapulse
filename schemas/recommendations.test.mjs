import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function load(relativePath, cache = new Map()) {
	const normalized = relativePath.replaceAll("\\", "/");
	const absolute = path.resolve(root, normalized);
	if (cache.has(absolute)) return cache.get(absolute).exports;
	const source = fs.readFileSync(absolute, "utf8");
	const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
	const mod = { exports: {} }; cache.set(absolute, mod);
	new Function("require", "module", "exports", js)((name) => {
		if (name === "zod") return { z };
		if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`, cache);
		if (name.startsWith(".")) return load(`${path.posix.normalize(path.posix.join(path.posix.dirname(normalized), name))}.ts`, cache);
		throw new Error(`Unexpected dependency: ${name}`);
	}, mod, mod.exports);
	return mod.exports;
}

const { GeminiRecommendationSelectionSchema, RecommendationRequestSchema, RecommendationResponseSchema } = load("schemas/recommendations.ts");

function movie(id) {
	return { tmdbId: id, title: `Film ${id}`, originalTitle: `Film ${id}`, releaseDate: "1994-04-12", overview: "An atmospheric character study.", posterPath: null, backdropPath: null, rating: 0, voteCount: 0, genreIds: [18], originalLanguage: "fr" };
}
function response() {
	return { personality: { title: "Quiet Observer", description: "You enjoy reflective, emotionally layered cinema." }, recommendations: Array.from({ length: 7 }, (_, i) => ({ reason: `This film fits your interest in reflective characters (${i}).`, movie: movie(i + 1) })) };
}

test("Gemini selector contract requires exactly seven unique candidate IDs and reasons", () => {
	const valid = { selections: Array.from({ length: 7 }, (_, i) => ({ tmdbId: i + 1, reason: `Personal fit ${i + 1}` })) };
	assert.equal(GeminiRecommendationSelectionSchema.safeParse(valid).success, true);
	assert.equal(GeminiRecommendationSelectionSchema.safeParse({ selections: valid.selections.slice(0, 6) }).success, false);
	assert.equal(GeminiRecommendationSelectionSchema.safeParse({ selections: [...valid.selections.slice(0, 6), valid.selections[0]] }).success, false);
	assert.equal(GeminiRecommendationSelectionSchema.safeParse({ selections: valid.selections, extra: true }).success, false);
});

test("recommendation request accepts existing filter contract and defaults omitted genres to none", () => {
	const value = { tasteProfile: { signals: [], likes: [], dislikes: [] }, preferences: { anchorMovie: "Arrival", vibes: [{ tag: "dreamlike", category: "atmosphere" }], decades: [1990], languages: ["fr"] }, confidence: { overall: 0.8 }, personality: { title: "Dreamer", description: "You like dreamlike cinema." } };
	const parsed = RecommendationRequestSchema.safeParse(value);
	assert.equal(parsed.success, true);
	assert.deepEqual(parsed.data.preferences.genreIds, []);
});

test("optional anchor note is trimmed, retained, and bounded by the preference schema", () => {
	const value = { tasteProfile: { signals: [], likes: [], dislikes: [] }, preferences: { anchorMovie: "Arrival", anchorNote: "  I want more stories adapted from novels.  ", vibes: [{ tag: "dreamlike", category: "atmosphere" }], decades: [], languages: [] }, confidence: { overall: 0.8 }, personality: { title: "Dreamer", description: "You like dreamlike cinema." } };
	const parsed = RecommendationRequestSchema.safeParse(value);
	assert.equal(parsed.success, true);
	assert.equal(parsed.data.preferences.anchorNote, "I want more stories adapted from novels.");
	const omitted = RecommendationRequestSchema.parse({ ...value, preferences: { ...value.preferences, anchorNote: undefined } });
	assert.equal(omitted.preferences.anchorNote, "");
	const tooLong = { ...value, preferences: { ...value.preferences, anchorNote: "n".repeat(201) } };
	assert.equal(RecommendationRequestSchema.safeParse(tooLong).success, false);
});

test("final response contains exactly seven distinct verified TMDB records", () => {
	assert.equal(RecommendationResponseSchema.safeParse(response()).success, true);
	assert.equal(RecommendationResponseSchema.safeParse({ ...response(), recommendations: response().recommendations.slice(0, 5) }).success, false);
	const duplicate = response(); duplicate.recommendations[6].movie.tmdbId = 1;
	assert.equal(RecommendationResponseSchema.safeParse(duplicate).success, false);
});
