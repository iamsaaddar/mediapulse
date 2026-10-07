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
		if (specifier === "@/services/gemini/interview") {
			return {
				runInterview: async (request) => {
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

	const route = loadTypeScript("app/api/interview/route.ts");
	return {
		POST: route.POST,
		calls,
		logEntries,
		AppError: loadTypeScript("lib/errors.ts").AppError,
		setServiceResult: (value) => { currentServiceResult = value; },
	};
}

function request(body) {
	return new Request("http://localhost/api/interview", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

function firstTurnRequest() {
	return {
		questionCount: 0,
		tasteProfile: { signals: [], likes: [], dislikes: [] },
		lastInteraction: null,
	};
}

function completionTurnRequest() {
	return {
		questionCount: 5,
		tasteProfile: {
			signals: [{ dimension: "characters", value: "Character-driven stories", confidence: 0.8 }],
			likes: ["emotionally layered stories"],
			dislikes: [],
		},
		lastInteraction: subsequentTurnRequest().lastInteraction,
	};
}

function subsequentTurnRequest() {
	return {
		questionCount: 1,
		tasteProfile: { signals: [], likes: [], dislikes: [] },
		lastInteraction: {
			question: {
				id: "story-type",
				text: "Which story stays with you?",
				required: true,
				type: "free_text",
			},
			answer: "Character-driven stories.",
		},
	};
}

function continueResult() {
	return {
		status: "continue",
		question: {
			id: "pace",
			text: "What pacing do you enjoy?",
			required: true,
			type: "free_text",
		},
		tasteUpdate: { signals: [], likes: [], dislikes: [] },
		confidence: { overall: 0.25 },
	};
}

function completeResult() {
	return {
		status: "complete",
		tasteUpdate: { signals: [], likes: [], dislikes: [] },
		confidence: { overall: 0.8 },
		personality: {
			title: "The Thoughtful Story Seeker",
			description: "You value emotionally layered stories and memorable characters.",
		},
	};
}

async function responseBody(response) {
	return response.json();
}

test("first turn returns 200 and passes the compact state to the service once", async () => {
	const service = loadRoute(continueResult());
	const response = await service.POST(request(firstTurnRequest()));

	assert.equal(response.status, 200);
	assert.deepEqual(await responseBody(response), continueResult());
	assert.equal(service.calls.length, 1);
	assert.deepEqual(service.calls[0], firstTurnRequest());
});

test("subsequent turn passes the latest interaction and returns the service result", async () => {
	const service = loadRoute(continueResult());
	const state = subsequentTurnRequest();
	const response = await service.POST(request(state));

	assert.equal(response.status, 200);
	assert.deepEqual(service.calls, [state]);
	assert.deepEqual(await responseBody(response), continueResult());
});

test("malformed JSON returns a safe 400 without calling the service", async () => {
	const service = loadRoute(continueResult());
	const response = await service.POST(request("{"));

	assert.equal(response.status, 400);
	assert.deepEqual(await responseBody(response), {
		error: { code: "INVALID_REQUEST", message: "Invalid request body." },
	});
	assert.equal(service.calls.length, 0);
});

test("invalid request shapes return 400 without calling the service", async () => {
	const invalidRequests = [
		{ ...firstTurnRequest(), questionCount: undefined },
		{ ...firstTurnRequest(), questionCount: "0" },
		{ ...firstTurnRequest(), questionCount: -1 },
		{ ...subsequentTurnRequest(), questionCount: 11 },
		{ ...subsequentTurnRequest(), questionCount: 1.5 },
		{ ...firstTurnRequest(), tasteProfile: { signals: [], likes: "x", dislikes: [] } },
		{ ...subsequentTurnRequest(), lastInteraction: { question: {}, answer: 5 } },
	];
	const service = loadRoute(continueResult());

	for (const invalidRequest of invalidRequests) {
		const response = await service.POST(request(invalidRequest));
		assert.equal(response.status, 400);
		assert.deepEqual((await responseBody(response)).error.code, "INVALID_REQUEST");
	}
	assert.equal(service.calls.length, 0);
});

test("inconsistent interview state is rejected before service invocation", async () => {
	const service = loadRoute(continueResult());
	const invalidStates = [
		{ ...firstTurnRequest(), lastInteraction: subsequentTurnRequest().lastInteraction },
		{ ...firstTurnRequest(), questionCount: 1 },
		{ ...subsequentTurnRequest(), questionCount: 0 },
	];

	for (const invalidState of invalidStates) {
		const response = await service.POST(request(invalidState));
		assert.equal(response.status, 400);
	}
	assert.equal(service.calls.length, 0);
});

test("complete service results pass through unchanged", async () => {
	const result = completeResult();
	const service = loadRoute(result);
	const response = await service.POST(request(completionTurnRequest()));

	assert.equal(response.status, 200);
	assert.deepEqual(await responseBody(response), result);
	assert.equal(service.calls.length, 1);
	assert.deepEqual(service.calls[0], completionTurnRequest());
});

test("application service errors use safe structured error responses", async () => {
	const service = loadRoute(continueResult());
	service.setServiceResult(new service.AppError(
		"AI_SERVICE_ERROR",
		"The interview service could not produce a valid response.",
		502,
	));
	const response = await service.POST(request(firstTurnRequest()));

	assert.equal(response.status, 502);
	assert.deepEqual(await responseBody(response), {
		error: {
			code: "AI_SERVICE_ERROR",
			message: "The interview service could not produce a valid response.",
		},
	});
});

test("unexpected service failures are hidden behind a generic 500 response", async () => {
	const service = loadRoute(new Error("GEMINI_API_KEY=secret at C:\\private\\path"));
	const response = await service.POST(request(firstTurnRequest()));
	const payload = await responseBody(response);

	assert.equal(response.status, 500);
	assert.deepEqual(payload, {
		error: {
			code: "INTERNAL_ERROR",
			message: "The interview service is temporarily unavailable.",
		},
	});
	assert.doesNotMatch(JSON.stringify(payload), /secret|private|GEMINI_API_KEY/);
	assert.doesNotMatch(JSON.stringify(service.logEntries), /secret|private|GEMINI_API_KEY/);
});

test("route delegates to the interview service and has no direct Gemini dependency", () => {
	const source = fs.readFileSync(path.join(root, "app/api/interview/route.ts"), "utf8");
	assert.match(source, /@\/services\/gemini\/interview/);
	assert.doesNotMatch(source, /@google\/genai|@\/services\/gemini\/client/);
});
