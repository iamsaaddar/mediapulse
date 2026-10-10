import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadTypeScript(relativePath, cache = new Map()) {
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
			if (specifier.startsWith("@/")) {
				return loadTypeScript(`${specifier.slice(2)}.ts`, cache);
			}
			if (specifier.startsWith(".")) {
				const parent = relativePath.replaceAll("\\", "/");
				const resolved = path.posix.normalize(
					path.posix.join(path.posix.dirname(parent), specifier),
				);
				return loadTypeScript(resolved.endsWith(".ts") ? resolved : `${resolved}.ts`, cache);
			}
			throw new Error(`Unexpected dependency: ${specifier}`);
		},
		loadedModule,
		loadedModule.exports,
	);
	return loadedModule.exports;
}

const sharedModuleCache = new Map();
const api = loadTypeScript("lib/recommendation-api.ts", sharedModuleCache);
const handoff = loadTypeScript("lib/recommendation-handoff.ts", sharedModuleCache);

function validCompletion() {
	return {
		status: "complete",
		tasteUpdate: {
			signals: [
				{ dimension: "emotion", value: "bittersweet", confidence: 0.86 },
			],
			likes: ["character-driven stories"],
			dislikes: ["shallow action"],
		},
		confidence: { overall: 0.73 },
		personality: {
			title: "The Quiet Reflector",
			description: "You value thoughtful character-focused films.",
		},
	};
}

function validRecommendationResponse() {
	return {
		personality: validCompletion().personality,
		recommendations: Array.from({ length: 5 }, (_, index) => ({
			reason: `This movie fits your interest in thoughtful stories ${index + 1}.`,
			movie: {
				tmdbId: index + 1,
				title: `Verified Movie ${index + 1}`,
				originalTitle: `Verified Movie ${index + 1}`,
				releaseDate: "2020-01-01",
				overview: "A character-focused movie.",
				posterPath: null,
				backdropPath: null,
				rating: 7.5,
				voteCount: 100,
				genreIds: [18],
				originalLanguage: "en",
			},
		})),
	};
}

test("completion handoff preserves actual confidence and Phase 6 fields", () => {
	const request = api.createRecommendationRequest(validCompletion());

	assert.deepEqual(request, {
		tasteProfile: validCompletion().tasteUpdate,
		confidence: { overall: 0.73 },
		personality: validCompletion().personality,
	});
	assert.equal(request.confidence.overall, 0.73);
});

test("posts the validated request to the existing recommendations endpoint", async () => {
	const request = api.createRecommendationRequest(validCompletion());
	const expected = validRecommendationResponse();
	let captured;
	const result = await api.requestRecommendations(request, async (url, init) => {
		captured = { url, init };
		return Response.json(expected);
	});

	assert.equal(captured.url, "/api/recommendations");
	assert.equal(captured.init.method, "POST");
	assert.equal(captured.init.headers["content-type"], "application/json");
	assert.deepEqual(JSON.parse(captured.init.body), request);
	assert.deepEqual(result, expected);
});

test("rejects invalid requests and unvalidated success responses", async () => {
	let calls = 0;
	await assert.rejects(
		api.requestRecommendations(
			{ ...api.createRecommendationRequest(validCompletion()), confidence: { overall: 2 } },
			async () => {
				calls += 1;
				return Response.json({});
			},
		),
		api.RecommendationApiError,
	);
	assert.equal(calls, 0);

	const invalidResponse = validRecommendationResponse();
	invalidResponse.recommendations.pop();
	await assert.rejects(
		api.requestRecommendations(api.createRecommendationRequest(validCompletion()), async () =>
			Response.json(invalidResponse),
		),
		(error) => error instanceof api.RecommendationApiError && /invalid response/i.test(error.message),
	);
});

test("maps API, malformed JSON, and network errors to safe client messages", async () => {
	await assert.rejects(
		api.requestRecommendations(api.createRecommendationRequest(validCompletion()), async () =>
			Response.json(
				{ error: { code: "MOVIE_DATA_ERROR", message: "secret key and provider stack" } },
				{ status: 502 },
			),
		),
		(error) =>
			error instanceof api.RecommendationApiError &&
			/movie data service/i.test(error.message) &&
			!error.message.includes("secret"),
	);

	await assert.rejects(
		api.requestRecommendations(api.createRecommendationRequest(validCompletion()), async () =>
			new Response("private provider internals", { status: 200 }),
		),
		(error) =>
			error instanceof api.RecommendationApiError &&
			!error.message.includes("private provider"),
	);

	await assert.rejects(
		api.requestRecommendations(api.createRecommendationRequest(validCompletion()), async () => {
			throw new Error("private network detail");
		}),
		(error) =>
			error instanceof api.RecommendationApiError &&
			!error.message.includes("private network"),
	);
});

test("handoff reports loading then success and ignores repeated completion submissions", async () => {
	const states = [];
	let resolveRequest;
	let sendCalls = 0;
	const handoffController = handoff.createRecommendationHandoff(
		(state) => states.push(state),
		async () => {
			sendCalls += 1;
			return new Promise((resolve) => {
				resolveRequest = resolve;
			});
		},
	);
	const request = api.createRecommendationRequest(validCompletion());
	const firstSubmit = handoffController.submit(request);

	assert.deepEqual(states, [{ status: "loading" }]);
	await handoffController.submit(request);
	assert.equal(sendCalls, 1);

	const result = validRecommendationResponse();
	resolveRequest(result);
	await firstSubmit;

	assert.deepEqual(states.at(-1), { status: "success", response: result });
	assert.equal(sendCalls, 1);
});

test("handoff reports failures and retries only after an explicit retry", async () => {
	const states = [];
	let sendCalls = 0;
	const handoffController = handoff.createRecommendationHandoff(
		(state) => states.push(state),
		async () => {
			sendCalls += 1;
			if (sendCalls === 1) throw new api.RecommendationApiError("Safe retry message.");
			return validRecommendationResponse();
		},
	);
	const request = api.createRecommendationRequest(validCompletion());

	await handoffController.submit(request);
	assert.deepEqual(states.at(-1), { status: "error", message: "Safe retry message." });
	await handoffController.submit(request);
	assert.equal(sendCalls, 1);

	await handoffController.submit(request, true);
	assert.equal(states.at(-1).status, "success");
	assert.equal(sendCalls, 2);
});
