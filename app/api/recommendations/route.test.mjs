import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);

function loadRoute(serviceResult) {
	const cache = new Map();
	const calls = [];
	const logEntries = [];
	let currentServiceResult = serviceResult;

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
			(specifier) => loadDependency(specifier, relativePath),
			loadedModule,
			loadedModule.exports,
		);
		return loadedModule.exports;
	}

	function loadDependency(specifier, parentPath) {
		if (specifier === "next/server") {
			return { NextResponse: { json: (body, init) => Response.json(body, init) } };
		}
		if (specifier === "@/services/recommendations/orchestrator") {
			return {
				generateRecommendationResponse: async (request) => {
					calls.push(request);
					if (currentServiceResult instanceof Error) throw currentServiceResult;
					return currentServiceResult;
				},
			};
		}
		if (specifier === "@/lib/logger") {
			return {
				logger: {
					info: (message, context) => logEntries.push({ message, context }),
					warn: (message, context) => logEntries.push({ message, context }),
					error: (message, context) => logEntries.push({ message, context }),
				},
			};
		}
		if (specifier.startsWith("@/")) {
			return loadTypeScript(`${specifier.slice(2)}.ts`);
		}
		if (specifier.startsWith(".")) {
			const normalizedParent = parentPath.replaceAll("\\", "/");
			const resolved = path.posix.normalize(
				path.posix.join(path.posix.dirname(normalizedParent), specifier),
			);
			return loadTypeScript(resolved.endsWith(".ts") ? resolved : `${resolved}.ts`);
		}
		if (specifier === "zod") return { z };
		throw new Error(`Unexpected route dependency: ${specifier}`);
	}

	const route = loadTypeScript("app/api/recommendations/route.ts");
	return {
		POST: route.POST,
		calls,
		logEntries,
		AppError: loadTypeScript("lib/errors.ts").AppError,
		setServiceResult: (value) => {
			currentServiceResult = value;
		},
	};
}

function request(body) {
	return new Request("http://localhost/api/recommendations", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

function validRequest() {
	return {
		tasteProfile: {
			signals: [{ dimension: "emotion", value: "bittersweet, introspective", confidence: 0.85 }],
			likes: ["character-driven dramas"],
			dislikes: ["shallow action films"],
		},
		confidence: { overall: 0.82 },
		personality: {
			title: "The Quiet Reflector",
			description: "You value emotionally layered stories and thoughtful character work.",
		},
	};
}

function validResponse() {
	return {
		personality: validRequest().personality,
		recommendations: Array.from({ length: 5 }, (_, index) => ({
			reason: `Reason ${index + 1}`,
			movie: {
				tmdbId: 100 + index,
				title: `Movie ${index + 1}`,
				originalTitle: `Original Movie ${index + 1}`,
				releaseDate: "2020-01-01",
				overview: "A thoughtful movie.",
				posterPath: "/poster.jpg",
				backdropPath: "/backdrop.jpg",
				rating: 8.1,
				voteCount: 200,
				genreIds: [18],
				originalLanguage: "en",
			},
		})),
	};
}

async function responseBody(response) {
	return response.json();
}

test("valid request passes through orchestrator output after schema validation", async () => {
	const payload = validResponse();
	const service = loadRoute(payload);
	const response = await service.POST(request(validRequest()));

	assert.equal(response.status, 200);
	assert.deepEqual(await responseBody(response), payload);
	assert.equal(service.calls.length, 1);
});

test("malformed JSON returns 400 without invoking the orchestrator", async () => {
	const service = loadRoute(validResponse());
	const response = await service.POST(request("{"));

	assert.equal(response.status, 400);
	assert.deepEqual(await responseBody(response), {
		error: { code: "INVALID_REQUEST", message: "Invalid request body." },
	});
	assert.equal(service.calls.length, 0);
});

test("invalid request shapes return 400 without invoking the orchestrator", async () => {
	const invalidRequests = [
		{ ...validRequest(), confidence: { overall: 2 } },
		{ ...validRequest(), personality: { title: "" } },
		{ ...validRequest(), tasteProfile: { signals: [], likes: "bad", dislikes: [] } },
	];
	const service = loadRoute(validResponse());

	for (const invalidRequest of invalidRequests) {
		const response = await service.POST(request(invalidRequest));
		assert.equal(response.status, 400);
		assert.deepEqual((await responseBody(response)).error.code, "INVALID_REQUEST");
	}
	assert.equal(service.calls.length, 0);
});

test("AppError responses are mapped to the correct HTTP status and safe payload", async () => {
	const service = loadRoute(validResponse());
	service.setServiceResult(new service.AppError("INSUFFICIENT_RESULTS", "Not enough verified movies.", 422));
	const response = await service.POST(request(validRequest()));

	assert.equal(response.status, 422);
	assert.deepEqual(await responseBody(response), {
		error: { code: "INSUFFICIENT_RESULTS", message: "Not enough verified movies." },
	});
});

test("classified Gemini and TMDB failures retain safe error contracts", async () => {
	const cases = [
		["AI_SERVICE_ERROR", "The recommendation service is temporarily unavailable.", 503],
		["MOVIE_DATA_ERROR", "The movie data provider is temporarily unavailable.", 502],
	];
	const service = loadRoute(validResponse());

	for (const [code, message, status] of cases) {
		service.setServiceResult(new service.AppError(code, message, status));
		const response = await service.POST(request(validRequest()));
		const payload = await responseBody(response);

		assert.equal(response.status, status);
		assert.deepEqual(payload, { error: { code, message } });
		assert.doesNotMatch(JSON.stringify(payload), /api[_-]?key|stack|private upstream/i);
	}
});

test("invalid orchestrator success data is rejected before it reaches the client", async () => {
	const invalidResponse = validResponse();
	invalidResponse.recommendations.pop();
	const service = loadRoute(invalidResponse);
	const response = await service.POST(request(validRequest()));
	const payload = await responseBody(response);

	assert.equal(response.status, 502);
	assert.equal(payload.error.code, "AI_SERVICE_ERROR");
	assert.doesNotMatch(JSON.stringify(payload), /Movie 1|poster\.jpg|Original Movie/);
});

test("unexpected orchestrator failures are hidden behind a generic 500 response", async () => {
	const service = loadRoute(new Error("unexpected failure"));
	const response = await service.POST(request(validRequest()));
	const payload = await responseBody(response);

	assert.equal(response.status, 500);
	assert.equal(payload.error.code, "INTERNAL_ERROR");
	assert.equal(payload.error.message, "The recommendation service is temporarily unavailable.");
});
