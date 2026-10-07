import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadTypeScript(relativePath) {
	const source = fs.readFileSync(path.join(root, relativePath), "utf8");
	const javascript = ts.transpileModule(source, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	}).outputText;
	const loaded = { exports: {} };
	new Function("require", "module", "exports", javascript)(
		(specifier) => {
			if (specifier === "zod") return { z };
			if (specifier === "@/schemas/api") return loadTypeScript("schemas/api.ts");
			if (specifier === "@/schemas/interview") return loadTypeScript("schemas/interview.ts");
			if (specifier === "@/constants/limits") return loadTypeScript("constants/limits.ts");
			if (specifier === "@/constants/taste-dimensions") return loadTypeScript("constants/taste-dimensions.ts");
			if (specifier === "./common") return loadTypeScript("schemas/common.ts");
			throw new Error(`Unexpected module: ${specifier}`);
		},
		loaded,
		loaded.exports,
	);
	return loaded.exports;
}

const { InterviewApiError, requestInterview } = loadTypeScript("lib/interview-api.ts");

function request() {
	return { questionCount: 0, tasteProfile: { signals: [], likes: [], dislikes: [] }, lastInteraction: null };
}

function validContinue() {
	return {
		status: "continue",
		question: { id: "q1", text: "What kind of story stays with you?", required: true, type: "free_text" },
		tasteUpdate: { signals: [], likes: [], dislikes: [] },
		confidence: { overall: 0.2 },
	};
}

function validComplete() {
	return {
		status: "complete",
		tasteUpdate: { signals: [], likes: [], dislikes: [] },
		confidence: { overall: 0.8 },
		personality: { title: "The Reflective Story Seeker", description: "You enjoy thoughtful stories." },
	};
}

test("posts the valid compact request and accepts a continue response", async () => {
	let captured;
	const result = await requestInterview(request(), async (url, init) => {
		captured = { url, init };
		return Response.json(validContinue());
	});
	assert.equal(captured.url, "/api/interview");
	assert.equal(captured.init.method, "POST");
	assert.deepEqual(JSON.parse(captured.init.body), request());
	assert.equal(result.status, "continue");
});

test("accepts a valid completion with personality", async () => {
	const completedRequest = { ...request(), questionCount: 5, lastInteraction: {
		question: { id: "q5", text: "What makes a film memorable?", required: true, type: "free_text" }, answer: "Its characters."
	} };
	const result = await requestInterview(completedRequest, async () => Response.json(validComplete()));
	assert.equal(result.status, "complete");
	assert.equal(result.personality.title, "The Reflective Story Seeker");
});

test("rejects unknown top-level and nested API response keys", async () => {
	for (const body of [
		{ ...validContinue(), recommendations: [] },
		{ ...validContinue(), question: { ...validContinue().question, recommendation: "unexpected" } },
	]) {
		await assert.rejects(
			requestInterview(request(), async () => Response.json(body)),
			(error) => error instanceof InterviewApiError && /invalid response/i.test(error.message),
		);
	}
});

test("rejects malformed successful responses and non-JSON bodies safely", async () => {
	await assert.rejects(requestInterview(request(), async () => Response.json({ status: "continue" })), InterviewApiError);
	await assert.rejects(
		requestInterview(request(), async () => new Response("private provider payload", { status: 200 })),
		(error) => error instanceof InterviewApiError && !error.message.includes("private"),
	);
});

test("uses safe structured API errors for client-visible failures", async () => {
	await assert.rejects(
		requestInterview(request(), async () => Response.json({ error: { code: "RATE_LIMITED", message: "The AI service is busy. Please try again shortly." } }, { status: 429 })),
		(error) => error instanceof InterviewApiError && /busy/i.test(error.message),
	);
	await assert.rejects(
		requestInterview(request(), async () => Response.json({ stack: "private path" }, { status: 500 })),
		(error) => error instanceof InterviewApiError && /temporarily unavailable/i.test(error.message) && !error.message.includes("private"),
	);
});

test("surfaces the established safe errors for every interview HTTP failure class", async () => {
	const failures = [
		[400, "INVALID_REQUEST", "Invalid interview request."],
		[429, "RATE_LIMITED", "The AI service is busy."],
		[502, "AI_SERVICE_ERROR", "The interview response was invalid."],
		[503, "AI_SERVICE_ERROR", "The AI service is unavailable."],
		[500, "INTERNAL_ERROR", "The interview service is unavailable."],
	];
	for (const [status, code, message] of failures) {
		await assert.rejects(
			requestInterview(request(), async () => Response.json({ error: { code, message } }, { status })),
			(error) => error instanceof InterviewApiError && error.message === message,
		);
	}
});

test("maps network failures to a safe retry message", async () => {
	await assert.rejects(
		requestInterview(request(), async () => { throw new Error("private provider detail"); }),
		(error) => error instanceof InterviewApiError && /connection/i.test(error.message) && !error.message.includes("private"),
	);
});

test("rejects invalid outgoing request state without issuing a network call", async () => {
	let fetchCalls = 0;
	await assert.rejects(
		requestInterview({ ...request(), questionCount: -1 }, async () => { fetchCalls += 1; return Response.json({}); }),
		InterviewApiError,
	);
	assert.equal(fetchCalls, 0);
});
