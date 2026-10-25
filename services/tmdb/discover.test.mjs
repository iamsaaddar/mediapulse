import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
function load(overrides = {}) {
	const cache = new Map();
	function visit(relative) {
		const normalized = relative.replaceAll("\\", "/"); const absolute = path.resolve(root, normalized);
		if (cache.has(absolute)) return cache.get(absolute).exports;
		const js = ts.transpileModule(fs.readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
		const mod = { exports: {} }; cache.set(absolute, mod);
		new Function("require", "module", "exports", js)((name) => {
			if (Object.hasOwn(overrides, name)) return overrides[name];
			if (name === "zod") return { z };
			if (name.startsWith("@/")) return visit(`${name.slice(2)}.ts`);
			if (name.startsWith(".")) return visit(`${path.posix.normalize(path.posix.join(path.posix.dirname(normalized), name))}.ts`);
			throw new Error(`Unexpected dependency: ${name}`);
		}, mod, mod.exports);
		return mod.exports;
	}
	return visit("services/tmdb/discover.ts");
}

test("TMDB discover uses supported personalized filters and explicit popularity-neutral sorts", async () => {
	let captured;
	const service = load({ "./client": { fetchTmdb: async (path, params) => { captured = { path, params }; return { results: [{ id: 1, title: "Film", original_title: "Film", release_date: "1994-01-01", overview: "Dreamlike drama.", poster_path: null, backdrop_path: null, genre_ids: [18], original_language: "fr", popularity: 999999, vote_count: 999999, vote_average: 10 }], total_pages: 3 }; } } });
	const result = await service.discoverMovies({ genreIds: [18, 35], keywordIds: [420], decades: [1990], languages: ["fr"], page: 2, sortBy: "original_title.asc" });
	assert.equal(captured.path, "/discover/movie");
	assert.equal(captured.params.sort_by, "original_title.asc");
	assert.equal(captured.params.with_genres, "18,35");
	assert.equal(captured.params.with_keywords, "420");
	assert.equal(captured.params.with_original_language, "fr");
	assert.equal(captured.params["primary_release_date.gte"], "1990-01-01");
	assert.equal(captured.params["primary_release_date.lte"], "1999-12-31");
	assert.equal("vote_count.gte" in captured.params, false);
	assert.equal("vote_average.gte" in captured.params, false);
	assert.equal(result.totalPages, 3);
	assert.equal(result.items[0].tmdbId, 1);
	assert.equal("rating" in result.items[0], false);
	assert.equal("voteCount" in result.items[0], false);
	assert.equal(captured.params.include_adult, "false");
	assert.equal(captured.params.include_video, "false");
});

test("empty TMDB results are an empty page and invalid pages are rejected", async () => {
	const service = load({ "./client": { fetchTmdb: async () => ({ results: [], total_pages: 0 }) } });
	const query = { genreIds: [], keywordIds: [], decades: [], languages: [], page: 1, sortBy: "primary_release_date.asc" };
	assert.deepEqual(await service.discoverMovies(query), { items: [], totalPages: 0 });
	await assert.rejects(service.discoverMovies({ ...query, page: 501 }));
	await assert.rejects(service.discoverMovies({ ...query, decades: [1980, 2000] }));
	await assert.rejects(service.discoverMovies({ ...query, languages: ["en", "fr"] }));
});
