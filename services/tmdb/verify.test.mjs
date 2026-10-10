import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);

function loadVerify({ results, details }) {
	const cache = new Map();

	function loadTypeScript(relativePath) {
		const absolutePath = path.resolve(root, relativePath);
		if (cache.has(absolutePath)) return cache.get(absolutePath).exports;
		const source = fs.readFileSync(absolutePath, "utf8");
		const javascript = ts.transpileModule(source, {
			compilerOptions: {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2022,
			},
		}).outputText;
		const loadedModule = { exports: {} };
		cache.set(absolutePath, loadedModule);
		new Function("require", "module", "exports", javascript)(
			(specifier) => {
				if (specifier === "zod") return { z };
				if (specifier === "@/schemas/movie") {
					return {
						VerifiedMovieSchema: z.object({
							tmdbId: z.number().int().positive(),
							title: z.string().min(1).max(300),
							originalTitle: z.string().min(1).max(300),
							releaseDate: z.string().max(10),
							overview: z.string().max(2000),
							posterPath: z.string().max(200).nullable(),
							backdropPath: z.string().max(200).nullable(),
							rating: z.number().min(0).max(10),
							voteCount: z.number().int().min(0),
							genreIds: z.array(z.number().int().positive()).max(20),
							originalLanguage: z.string().min(1).max(20),
						}).strict(),
					};
				}
				if (specifier === "./movie") {
					return {
						getMovieById: async (id) => {
							if (!details[id]) throw new Error(`Missing details for ${id}`);
							return details[id];
						},
					};
				}
				if (specifier === "./search") {
					return {
						searchMovies: async (title, year) => {
							return results[`${title}:${year ?? "none"}`] ?? [];
						},
					};
				}
				throw new Error(`Unexpected dependency: ${specifier}`);
			},
			loadedModule,
			loadedModule.exports,
		);
		return loadedModule.exports;
	}

	return loadTypeScript("services/tmdb/verify.ts");
}

test("exact title match and correct year are accepted", async () => {
	const verify = loadVerify({
		results: {
			"Arrival:2016": [
				{ id: 12, title: "Arrival", originalTitle: "Arrival", releaseDate: "2016-11-11" },
			],
		},
		details: {
			12: {
				id: 12,
				title: "Arrival",
				originalTitle: "Arrival",
				releaseDate: "2016-11-11",
				overview: "A thoughtful story.",
				posterPath: "/poster.jpg",
				backdropPath: "/backdrop.jpg",
				rating: 8.1,
				voteCount: 100,
				genreIds: [18],
				originalLanguage: "en",
			},
		},
	});

	const result = await verify.verifyMovieCandidate({ title: "Arrival", year: 2016, reason: "Thoughtful, emotional sci-fi." });
	assert.equal(result?.tmdbId, 12);
	assert.equal(result?.title, "Arrival");
});

test("year mismatch or ambiguous matches are rejected", async () => {
	const verify = loadVerify({
		results: {
			"Matrix:none": [
				{ id: 1, title: "The Matrix", originalTitle: "The Matrix", releaseDate: "1999-03-31" },
				{ id: 2, title: "The Matrix Reloaded", originalTitle: "The Matrix Reloaded", releaseDate: "2003-05-15" },
			],
		},
		details: {
			1: {
				id: 1,
				title: "The Matrix",
				originalTitle: "The Matrix",
				releaseDate: "1999-03-31",
				overview: "A classic.",
				posterPath: "/matrix.jpg",
				backdropPath: "/matrix-backdrop.jpg",
				rating: 8.7,
				voteCount: 200,
				genreIds: [28],
				originalLanguage: "en",
			},
		},
	});

	assert.equal(await verify.verifyMovieCandidate({ title: "The Matrix", year: 2003, reason: "Action sci-fi." }), null);
	assert.equal(await verify.verifyMovieCandidate({ title: "No Clear Match", year: null, reason: "No match." }), null);
});
