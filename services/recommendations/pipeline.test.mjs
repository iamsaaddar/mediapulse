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

function createModuleLoader(overrides = {}) {
	const cache = new Map();

	function load(relativePath, moduleOverrides = overrides) {
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

		function resolve(specifier) {
			if (Object.hasOwn(moduleOverrides, specifier)) {
				return moduleOverrides[specifier];
			}
			if (specifier === "server-only") return {};
			if (specifier === "zod") return { z };
			if (specifier.startsWith("@/")) {
				return load(`${specifier.slice(2)}.ts`);
			}
			if (specifier.startsWith(".")) {
				const normalizedParent = relativePath.replaceAll("\\", "/");
				const resolved = path.posix.normalize(
					path.posix.join(path.posix.dirname(normalizedParent), specifier),
				);
				return load(resolved.endsWith(".ts") ? resolved : `${resolved}.ts`);
			}
			throw new Error(`Unexpected dependency: ${specifier}`);
		}

		new Function("require", "module", "exports", javascript)(
			resolve,
			loadedModule,
			loadedModule.exports,
		);
		return loadedModule.exports;
	}

	return load;
}

function validRequest() {
	return {
		tasteProfile: {
			signals: [
				{ dimension: "emotion", value: "bittersweet", confidence: 0.85 },
			],
			likes: ["character-driven stories"],
			dislikes: ["shallow action films"],
		},
		confidence: { overall: 0.82 },
		personality: {
			title: "The Quiet Reflector",
			description: "You value emotionally layered stories and thoughtful characters.",
		},
	};
}

function candidate(title, year = null) {
	return {
		title,
		year,
		reason: `This fits your interest in thoughtful stories: ${title}.`,
	};
}

function verifiedMovie(id, title) {
	return {
		tmdbId: id,
		title,
		originalTitle: title,
		releaseDate: "2020-01-01",
		overview: "A character-driven feature film.",
		posterPath: null,
		backdropPath: null,
		rating: 7.5,
		voteCount: 100,
		genreIds: [18],
		originalLanguage: "en",
	};
}

function createOrchestrator({ batches, verify }) {
	let generationCalls = 0;
	const verifiedCandidates = [];
	const load = createModuleLoader({
		"@/services/gemini/recommendations": {
			generateRecommendations: async () => {
				const batch = batches[generationCalls];
				generationCalls += 1;
				if (batch instanceof Error) throw batch;
				return batch ?? [];
			},
		},
		"@/services/tmdb/verify": {
			verifyMovieCandidate: async (item) => {
				verifiedCandidates.push(item);
				return verify(item, verifiedCandidates.length);
			},
		},
		"@/lib/logger": {
			logger: { info() {}, warn() {}, error() {} },
		},
	});
	const orchestratorModule = load("services/recommendations/orchestrator.ts");
	const { AppError } = load("lib/errors.ts");
	return {
		generateRecommendationResponse: orchestratorModule.generateRecommendationResponse,
		AppError,
		get generationCalls() {
			return generationCalls;
		},
		verifiedCandidates,
	};
}

function collectNodes(schema, output = []) {
	output.push(schema);
	if (schema.properties) {
		for (const child of Object.values(schema.properties)) collectNodes(child, output);
	}
	if (schema.items) collectNodes(schema.items, output);
	if (Array.isArray(schema.anyOf)) {
		for (const child of schema.anyOf) collectNodes(child, output);
	}
	return output;
}

class MockGeminiClientError extends Error {
	constructor(code) {
		super("private provider message containing an API key");
		this.code = code;
	}
}

function createGeminiRecommendationService() {
	const calls = [];
	let providerError;
	const load = createModuleLoader({
		"@/services/gemini/client": {
			GeminiClientError: MockGeminiClientError,
			getGeminiClient: () => ({
				generateStructured: async (prompt, schema, options) => {
					calls.push({ prompt, schema, options });
					if (providerError) throw providerError;
					return {
						candidates: Array.from({ length: 7 }, (_, index) =>
							candidate(`Candidate ${index + 1}`, index === 0 ? null : 2000 + index),
						),
					};
				},
			}),
		},
		"@/lib/logger": {
			logger: { info() {}, warn() {}, error() {} },
		},
	});
	return {
		generateRecommendations: load("services/gemini/recommendations.ts").generateRecommendations,
		calls,
		setProviderError(error) {
			providerError = error;
		},
	};
}

test("Gemini structured schema projects nullable years without a null-only branch", async () => {
	const service = createGeminiRecommendationService();
	const candidates = await service.generateRecommendations(validRequest());

	assert.equal(candidates.length, 7);
	assert.equal(service.calls.length, 1);
	assert.match(service.calls[0].prompt, /"overall":0\.82/);

	const candidateSchema = service.calls[0].schema.properties.candidates.items;
	const projectedYear = candidateSchema.properties.year;
	assert.equal(projectedYear.nullable, true, JSON.stringify(projectedYear));
	assert.ok(
		collectNodes(projectedYear).some((node) => node.type === "INTEGER"),
		"the year schema retains its integer branch",
	);
	assert.ok(
		collectNodes(projectedYear).every(
			(node) => node.type !== undefined || node.nullable !== true,
		),
		"nullable union projection does not emit a type-less null-only branch",
	);
});

test("Gemini provider failures map to safe recommendation errors", async () => {
	const service = createGeminiRecommendationService();
	service.setProviderError(new MockGeminiClientError("RATE_LIMITED"));

	await assert.rejects(
		service.generateRecommendations(validRequest()),
		(error) =>
			error.code === "RATE_LIMITED" &&
			error.statusCode === 429 &&
			!error.message.includes("private provider message"),
	);
});

test("invalid Gemini candidate output is rejected without returning provider data", async () => {
	const load = createModuleLoader({
		"@/services/gemini/client": {
			GeminiClientError: MockGeminiClientError,
			getGeminiClient: () => ({
				generateStructured: async () => ({ candidates: [{ title: "untrusted raw output" }] }),
			}),
		},
		"@/lib/logger": {
			logger: { info() {}, warn() {}, error() {} },
		},
	});
	const { generateRecommendations } = load("services/gemini/recommendations.ts");

	await assert.rejects(
		generateRecommendations(validRequest()),
		(error) =>
			error.code === "AI_SERVICE_ERROR" &&
			error.statusCode === 502 &&
			!error.message.includes("untrusted raw output"),
	);
});

test("orchestrator returns exactly five distinct verified movies and skips unverified candidates", async () => {
	const batches = [
		[
			candidate("No TMDB match"),
			candidate("Candidate A"),
			candidate("Alternate wording for A"),
			candidate("Candidate B"),
			candidate("Candidate C"),
			candidate("Candidate D"),
			candidate("Candidate E"),
		],
	];
	const service = createOrchestrator({
		batches,
		verify: (item) => {
			if (item.title === "No TMDB match") return null;
			const id = item.title.endsWith("A") || item.title === "Alternate wording for A" ? 1 :
				item.title.endsWith("B") ? 2 :
					item.title.endsWith("C") ? 3 :
						item.title.endsWith("D") ? 4 : 5;
			return verifiedMovie(id, `TMDB canonical ${id}`);
		},
	});

	const response = await service.generateRecommendationResponse(validRequest());

	assert.equal(response.recommendations.length, 5);
	assert.equal(new Set(response.recommendations.map(({ movie }) => movie.tmdbId)).size, 5);
	assert.equal(service.generationCalls, 1);
	assert.equal(response.recommendations.some(({ movie }) => movie.title === "No TMDB match"), false);
	assert.ok(response.recommendations.every(({ movie }) => movie.title.startsWith("TMDB canonical")));
});

test("duplicate normalized candidate titles and verified IDs are not returned twice", async () => {
	const service = createOrchestrator({
		batches: [
			[
				candidate("Same Candidate"),
				candidate(" same candidate "),
				candidate("Second Candidate"),
				candidate("Third Candidate"),
				candidate("Fourth Candidate"),
				candidate("Fifth Candidate"),
				candidate("Sixth Candidate"),
			],
		],
		verify: (item) => {
			if (item.title === "Same Candidate") return verifiedMovie(1, "Canonical One");
			if (item.title === "Second Candidate") return verifiedMovie(1, "Duplicate ID");
			const id = item.title.startsWith("Third") ? 2 :
				item.title.startsWith("Fourth") ? 3 :
					item.title.startsWith("Fifth") ? 4 : 5;
			return verifiedMovie(id, `Canonical ${id}`);
		},
	});

	const response = await service.generateRecommendationResponse(validRequest());

	assert.equal(response.recommendations.length, 5);
	assert.equal(service.verifiedCandidates.filter(({ title }) => title.toLowerCase() === " same candidate ".trim()).length, 1);
	assert.equal(new Set(response.recommendations.map(({ movie }) => movie.tmdbId)).size, 5);
});

test("insufficient verified results stop after the two bounded generation batches", async () => {
	const batches = [
		Array.from({ length: 7 }, (_, index) => candidate(`Batch one ${index}`)),
		Array.from({ length: 7 }, (_, index) => candidate(`Batch two ${index}`)),
	];
	const service = createOrchestrator({
		batches,
		verify: (_item, call) => call % 3 === 0 ? verifiedMovie(call, `Movie ${call}`) : null,
	});

	await assert.rejects(
		service.generateRecommendationResponse(validRequest()),
		(error) => error.code === "INSUFFICIENT_RESULTS" && error.statusCode === 422,
	);
	assert.equal(service.generationCalls, 2);
	assert.ok(service.verifiedCandidates.length <= 14);
});

test("classified provider failures propagate instead of becoming partial success", async () => {
	const providerFailure = Object.assign(
		new Error("The movie data provider is temporarily unavailable."),
		{ code: "MOVIE_DATA_ERROR", statusCode: 503 },
	);
	const service = createOrchestrator({
		batches: [[candidate("Candidate that reaches TMDB")]],
		verify: () => {
			throw providerFailure;
		},
	});

	await assert.rejects(
		service.generateRecommendationResponse(validRequest()),
		(error) => error.code === "MOVIE_DATA_ERROR" && error.statusCode === 503,
	);
	assert.equal(service.generationCalls, 1);
});
