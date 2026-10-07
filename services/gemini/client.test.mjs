import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const logEntries = [];
const { createGeminiClient, GeminiClientError } = loadClient();

function loadClient() {
	const source = fs.readFileSync(path.join(root, "services/gemini/client.ts"), "utf8");
	const javascript = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText;
	const loadedModule = { exports: {} };
	new Function("require", "module", "exports", javascript)(
		(specifier) => {
			if (specifier === "server-only") return {};
			if (specifier === "@google/genai") {
				return { GoogleGenAI: class GoogleGenAI {} };
			}
			if (specifier === "@/config/gemini") {
				return { GEMINI_CONFIG: { model: "gemini-test", defaultTemperature: 0.4 } };
			}
			if (specifier === "@/lib/env") {
				return { getGeminiEnv: () => ({ GEMINI_API_KEY: "test-api-key" }) };
			}
			if (specifier === "@/lib/logger") {
				return {
					logger: Object.fromEntries(
						["info", "warn", "error"].map((level) => [
							level,
							(message, context) => logEntries.push({ level, message, context }),
						]),
					),
				};
			}
			throw new Error(`Unexpected Gemini client dependency: ${specifier}`);
		},
		loadedModule,
		loadedModule.exports,
	);
	return loadedModule.exports;
}

function createHarness(outcomes, { getApiKey } = {}) {
	const calls = [];
	const delays = [];
	const client = createGeminiClient({
		getApiKey: getApiKey ?? (() => "test-api-key"),
		getProvider: () => ({
			models: {
				generateContent: async (request) => {
					calls.push(request);
					const outcome = outcomes.shift();
					if (outcome instanceof Error) throw outcome;
					if (outcome?.error) throw outcome.error;
					return { text: outcome?.text ?? "{\"ok\":true}" };
				},
			},
		}),
		sleep: async (delayMs) => delays.push(delayMs),
	});
	return { client, calls, delays };
}

function httpError(status) {
	return Object.assign(new Error(`provider returned ${status}`), { status });
}

test("immediate provider success makes one generation call", async () => {
	const harness = createHarness([{ text: "hello" }]);
	assert.equal(await harness.client.generateText("private prompt"), "hello");
	assert.equal(harness.calls.length, 1);
	assert.equal(harness.calls[0].config.httpOptions.retryOptions.attempts, 1);
	assert.deepEqual(harness.delays, []);
});

test("503 retries once with bounded backoff and then succeeds", async () => {
	const harness = createHarness([{ error: httpError(503) }, { text: "{\"ok\":true}" }]);
	assert.deepEqual(
		await harness.client.generateStructured("private prompt", { type: "OBJECT" }),
		{ ok: true },
	);
	assert.equal(harness.calls.length, 2);
	assert.deepEqual(harness.delays, [150]);
});

test("429 retries once and then succeeds", async () => {
	const harness = createHarness([{ error: httpError(429) }, { text: "answer" }]);
	assert.equal(await harness.client.generateText("private prompt"), "answer");
	assert.equal(harness.calls.length, 2);
	assert.deepEqual(harness.delays, [150]);
});

test("persistent transient failures stop at exactly two attempts", async () => {
	const harness = createHarness([{ error: httpError(503) }, { error: httpError(503) }]);
	await assert.rejects(
		harness.client.generateText("private prompt"),
		(error) => error instanceof GeminiClientError && error.code === "PROVIDER_UNAVAILABLE",
	);
	assert.equal(harness.calls.length, 2);
	assert.deepEqual(harness.delays, [150]);
});

test("400 and provider authentication failures are not retried", async () => {
	for (const [error, expectedCode] of [
		[httpError(400), "INVALID_REQUEST"],
		[httpError(401), "AUTHENTICATION_ERROR"],
		[httpError(403), "AUTHENTICATION_ERROR"],
	]) {
		const harness = createHarness([{ error }]);
		await assert.rejects(
			harness.client.generateText("private prompt"),
			(failure) => failure.code === expectedCode,
		);
		assert.equal(harness.calls.length, 1);
		assert.deepEqual(harness.delays, []);
	}
});

test("network and timeout failures retry once", async () => {
	const networkError = new TypeError("fetch failed");
	const timeoutError = new Error("operation timed out");
	timeoutError.name = "TimeoutError";
	for (const error of [networkError, timeoutError]) {
		const harness = createHarness([{ error }, { text: "ok" }]);
		assert.equal(await harness.client.generateText("private prompt"), "ok");
		assert.equal(harness.calls.length, 2);
		assert.deepEqual(harness.delays, [150]);
	}
});

test("missing API key is a non-retryable configuration failure", async () => {
	const harness = createHarness([], { getApiKey: () => { throw new Error("missing key"); } });
	await assert.rejects(
		harness.client.generateText("private prompt"),
		(error) => error.code === "CONFIGURATION_ERROR",
	);
	assert.equal(harness.calls.length, 0);
	assert.deepEqual(harness.delays, []);
});

test("malformed structured JSON is not retried and logs no prompt or response", async () => {
	const harness = createHarness([{ text: "not-json" }]);
	await assert.rejects(
		harness.client.generateStructured("sensitive prompt", { type: "OBJECT" }),
		(error) => error.code === "INVALID_RESPONSE",
	);
	assert.equal(harness.calls.length, 1);
	assert.deepEqual(harness.delays, []);
	assert.doesNotMatch(JSON.stringify(logEntries), /sensitive prompt|not-json|test-api-key/);
});

test("retry logs contain category and attempt metadata without provider message", async () => {
	logEntries.length = 0;
	const harness = createHarness([{ error: httpError(503) }, { text: "ok" }]);
	await harness.client.generateText("sensitive prompt");
	const failedAttempt = logEntries.find((entry) => entry.level === "warn");
	assert.equal(failedAttempt.context.category, "PROVIDER_UNAVAILABLE");
	assert.equal(failedAttempt.context.attempt, 1);
	assert.equal(failedAttempt.context.maxAttempts, 2);
	assert.equal(failedAttempt.context.retrying, true);
	assert.equal("providerMessage" in failedAttempt.context, false);
	assert.doesNotMatch(JSON.stringify(logEntries), /sensitive prompt|test-api-key/);
});
