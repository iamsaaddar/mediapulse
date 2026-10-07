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
const logEntries = [];
const { InterviewRequestSchema, InterviewResponseSchema } = loadTypeScript("schemas/interview.ts");

class FakeGeminiClientError extends Error {
	constructor(code, providerStatus) {
		super("private provider detail");
		this.code = code;
		this.providerStatus = providerStatus;
	}
}

function loadTypeScript(relativePath, resolver = loadApplicationModule) {
	const source = fs.readFileSync(path.join(root, relativePath), "utf8");
	const javascript = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText;
	const loadedModule = { exports: {} };
	new Function("require", "module", "exports", javascript)(
		resolver,
		loadedModule,
		loadedModule.exports,
	);
	return loadedModule.exports;
}

function loadApplicationModule(moduleName) {
	switch (moduleName) {
		case "server-only":
			return {};
		case "zod":
			return { z };
		case "@/constants/limits":
			return loadTypeScript("constants/limits.ts");
		case "@/constants/taste-dimensions":
			return loadTypeScript("constants/taste-dimensions.ts");
		case "./common":
			return loadTypeScript("schemas/common.ts");
		case "@/schemas/interview":
			return loadTypeScript("schemas/interview.ts");
		case "@/lib/errors":
			return loadTypeScript("lib/errors.ts");
		case "@/lib/logger":
			return {
				logger: Object.fromEntries(
					["info", "warn", "error"].map((level) => [
						level,
						(message, context) => logEntries.push({ level, message, context }),
					]),
				),
			};
		case "./interview-prompt":
			return loadTypeScript("services/gemini/interview-prompt.ts");
		default:
			throw new Error(`Unexpected interview-service dependency: ${moduleName}`);
	}
}

function createService(providerResult) {
	const calls = [];
	const client = {
		async generateStructured(prompt, schema) {
			calls.push({ prompt, schema });
			if (providerResult instanceof Error) throw providerResult;
			return providerResult;
		},
	};
	const service = loadTypeScript(
		"services/gemini/interview.ts",
		(moduleName) => {
			if (moduleName === "@/services/gemini/client") {
				return {
					GeminiClientError: FakeGeminiClientError,
					getGeminiClient: () => client,
				};
			}
			return loadApplicationModule(moduleName);
		},
	);
	return { runInterview: service.runInterview, calls };
}

function createRequest(questionCount = 0) {
	return {
		questionCount,
		tasteProfile: { signals: [], likes: [], dislikes: [] },
		lastInteraction: questionCount === 0 ? null : {
			question: {
				id: "previous-question",
				text: "What kind of story do you enjoy?",
				required: true,
				type: "free_text",
			},
			answer: "I enjoy thoughtful, character-driven stories.",
		},
	};
}

function createContinueResult() {
	return {
		status: "continue",
		question: {
			id: "story-focus",
			text: "Which kind of story tends to stay with you?",
			required: true,
			type: "single_choice",
			options: [
				{ id: "intimate", label: "An intimate character story", value: "intimate" },
				{ id: "expansive", label: "A sweeping journey", value: "expansive" },
			],
		},
		tasteUpdate: { signals: [], likes: [], dislikes: [] },
		confidence: { overall: 0.25 },
	};
}

function createCompleteResult() {
	return {
		status: "complete",
		tasteUpdate: {
			signals: [
				{ dimension: "emotion", value: "bittersweet", confidence: 0.85 },
			],
			likes: ["emotionally layered stories"],
			dislikes: ["mean-spirited humor"],
		},
		confidence: { overall: 0.82 },
		personality: {
			title: "The Atmospheric Story Seeker",
			description: "You enjoy emotionally rich stories with vivid atmosphere and earned, open-ended conclusions.",
		},
	};
}

function createSignal(dimension = "story", value = "Character-led stories", confidence = 0.5) {
	return { dimension, value, confidence };
}

function createOption(index) {
	return {
		id: `option-${index}`,
		label: `Option ${index}`,
		value: `value-${index}`,
	};
}

function collectSchemaNodes(schema, nodes = []) {
	nodes.push(schema);
	if (Array.isArray(schema.anyOf)) {
		for (const branch of schema.anyOf) collectSchemaNodes(branch, nodes);
	}
	if (schema.properties && typeof schema.properties === "object") {
		for (const property of Object.values(schema.properties)) {
			collectSchemaNodes(property, nodes);
		}
	}
	if (schema.items) collectSchemaNodes(schema.items, nodes);
	return nodes;
}

test("first turn sends the compact initial state and accepts one continue question", async () => {
	const request = createRequest();
	const result = createContinueResult();
	const service = createService(result);

	assert.deepEqual(await service.runInterview(request), result);
	assert.equal(service.calls.length, 1);
	assert.match(service.calls[0].prompt, /CURRENT COMPACT INTERVIEW STATE/);
	assert.ok(service.calls[0].prompt.includes(JSON.stringify(request)));
	assert.ok(service.calls[0].prompt.includes("MediaPulse Movie Taste Interviewer"));
	assert.equal(service.calls[0].schema.type, undefined);
	assert.ok(Array.isArray(service.calls[0].schema.anyOf));
	assert.equal(service.calls[0].schema.anyOf.length, 2);
	assert.ok(
		collectSchemaNodes(service.calls[0].schema).every(
			(node) => !(node.type && node.anyOf),
		),
		"Gemini schema nodes must not combine type and anyOf",
	);
	assert.ok(
		collectSchemaNodes(service.calls[0].schema).every(
			(node) => node.pattern === undefined && node.maxLength === undefined && node.maxItems === undefined,
		),
		"Gemini projection must omit model-incompatible validation constraints",
	);
	assert.deepEqual(
		service.calls[0].schema.anyOf.map((branch) =>
			branch.properties.status.enum[0],
		),
		["continue", "complete"],
	);
	assert.ok(service.calls[0].schema.anyOf[0].properties.question.anyOf.length === 3);
	assert.equal(
		service.calls[0].schema.anyOf[1].properties.question,
		undefined,
		"complete responses must retain their established shape",
	);
	assert.deepEqual(
		Object.keys(service.calls[0].schema.anyOf[1].properties).sort(),
		["confidence", "personality", "status", "tasteUpdate"],
		"completion responses must include the established personality contract",
	);
	const personalitySchema = service.calls[0].schema.anyOf[1].properties.personality;
	assert.equal(personalitySchema.type, "OBJECT");
	assert.deepEqual(personalitySchema.required.sort(), ["description", "title"]);
	assert.equal(personalitySchema.properties.title.type, "STRING");
	assert.equal(personalitySchema.properties.description.type, "STRING");
	const continueSchema = service.calls[0].schema.anyOf[0];
	const questionSchema = continueSchema.properties.question;
	const singleChoiceSchema = questionSchema.anyOf.find(
		(branch) => branch.properties?.type?.enum?.[0] === "single_choice",
	);
	assert.equal(singleChoiceSchema.properties.options.maxItems, undefined);
	assert.equal(singleChoiceSchema.properties.text.maxLength, undefined);
	assert.equal(singleChoiceSchema.properties.text.pattern, undefined);
	assert.equal(continueSchema.properties.tasteUpdate.properties.signals.maxItems, undefined);
	assert.equal(continueSchema.properties.tasteUpdate.properties.likes.maxItems, undefined);
	assert.equal(continueSchema.properties.tasteUpdate.properties.likes.items.maxLength, undefined);
});

test("subsequent turns include the latest profile and interaction", async () => {
	const request = {
		questionCount: 6,
		tasteProfile: {
			signals: [
				{ dimension: "pacing", value: "slow, atmospheric", confidence: 0.9 },
			],
			likes: ["patient storytelling"],
			dislikes: ["abrupt tonal shifts"],
		},
		lastInteraction: {
			question: {
				id: "pace",
				text: "What pacing feels right?",
				required: true,
				type: "free_text",
			},
			answer: "Slow when the atmosphere is rich.",
		},
	};
	const service = createService(createContinueResult());

	await service.runInterview(request);

	assert.equal(service.calls.length, 1);
	assert.ok(service.calls[0].prompt.includes(JSON.stringify(request)));
});

test("accepts a valid completion result using the established schema", async () => {
	const result = createCompleteResult();
	const service = createService(result);

	const request = createRequest(5);
	request.tasteProfile.signals = [createSignal("characters", "Thoughtful character arcs", 0.8)];
	request.tasteProfile.likes = ["character-driven stories"];
	assert.deepEqual(await service.runInterview(request), result);
	assert.equal(service.calls.length, 1);
});

test("application rejects completion before five answered questions", async () => {
	for (const questionCount of [0, 4]) {
		const service = createService(createCompleteResult());
		await assert.rejects(
			service.runInterview(createRequest(questionCount)),
			(error) => error.code === "AI_SERVICE_ERROR" && error.statusCode === 502,
		);
		assert.equal(service.calls.length, 1);
		assert.equal(logEntries.at(-1)?.context?.category, "INTERVIEW_LIMIT_VIOLATION");
	}
});

test("application allows completion at the minimum and maximum question counts", async () => {
	for (const questionCount of [5, 10]) {
		const service = createService(createCompleteResult());
		const result = await service.runInterview(createRequest(questionCount));
		assert.equal(result.status, "complete");
		assert.equal(service.calls.length, 1);
	}
});

test("application prevents continuing beyond the ten-question maximum", async () => {
	const service = createService(createContinueResult());
	await assert.rejects(
		service.runInterview(createRequest(10)),
		(error) => error.code === "AI_SERVICE_ERROR" && error.statusCode === 502,
	);
	assert.equal(service.calls.length, 1);
	assert.equal(logEntries.at(-1)?.context?.category, "INTERVIEW_LIMIT_VIOLATION");
});

test("continue response is valid without a personality", () => {
	const result = createContinueResult();
	assert.equal("personality" in result, false);
	assert.equal(InterviewResponseSchema.safeParse(result).success, true);
});

test("completion response requires a title and description personality", () => {
	assert.equal(InterviewResponseSchema.safeParse(createCompleteResult()).success, true);
	const invalidPersonalities = [
		{},
		{ title: "A specific title" },
		{ description: "A grounded description." },
		{ title: 42, description: "A grounded description." },
		{ title: "A specific title", description: false },
		{ title: "", description: "A grounded description." },
		{ title: "A specific title", description: "" },
		{ title: "   ", description: "A grounded description." },
		{ title: "A specific title", description: "   " },
		{ title: "x".repeat(81), description: "A grounded description." },
		{ title: "A specific title", description: "x".repeat(601) },
	];

	for (const personality of invalidPersonalities) {
		assert.equal(
			InterviewResponseSchema.safeParse({
				...createCompleteResult(),
				personality,
			}).success,
			false,
			`expected invalid personality ${JSON.stringify(personality)} to be rejected`,
		);
	}
	assert.equal(
		InterviewResponseSchema.safeParse({
			...createCompleteResult(),
			personality: undefined,
		}).success,
		false,
	);
});

test("rejects missing fields, malformed types, and values outside controlled unions", () => {
	const invalidResponses = [
		{ ...createContinueResult(), status: undefined },
		{ ...createContinueResult(), question: undefined },
		{ ...createContinueResult(), status: 1 },
		{ ...createContinueResult(), status: "paused" },
		{ ...createContinueResult(), confidence: { overall: "0.5" } },
		{ ...createContinueResult(), tasteUpdate: { ...createContinueResult().tasteUpdate, signals: "signals" } },
		{ ...createContinueResult(), tasteUpdate: { ...createContinueResult().tasteUpdate, likes: {} } },
		{ ...createContinueResult(), tasteUpdate: { ...createContinueResult().tasteUpdate, dislikes: 7 } },
		{
			...createContinueResult(),
			question: { ...createContinueResult().question, text: 7 },
		},
		{
			...createContinueResult(),
			question: { ...createContinueResult().question, type: "slider" },
		},
		{
			...createContinueResult(),
			question: { ...createContinueResult().question, options: {} },
		},
		{
			...createContinueResult(),
			tasteUpdate: {
				...createContinueResult().tasteUpdate,
				signals: [createSignal("director")],
			},
		},
		{ ...createCompleteResult(), personality: "The Film Fan" },
		{ ...createCompleteResult(), personality: { title: [], description: "Valid text" } },
		{ ...createCompleteResult(), personality: { title: "Valid title", description: {} } },
	];

	for (const response of invalidResponses) {
		assert.equal(InterviewResponseSchema.safeParse(response).success, false);
	}
});

test("confidence accepts its inclusive boundaries and rejects non-finite or out-of-range values", () => {
	for (const confidence of [0, 1]) {
		assert.equal(
			InterviewResponseSchema.safeParse({
				...createContinueResult(),
				confidence: { overall: confidence },
				tasteUpdate: {
					...createContinueResult().tasteUpdate,
					signals: [createSignal("story", "A preference", confidence)],
				},
			}).success,
			true,
		);
	}
	for (const confidence of [-0.1, 1.1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NaN]) {
		assert.equal(
			InterviewResponseSchema.safeParse({
				...createContinueResult(),
				confidence: { overall: confidence },
			}).success,
			false,
		);
	}
});

test("request question count and state consistency remain bounded by the existing contract", () => {
	assert.equal(InterviewRequestSchema.safeParse(createRequest()).success, true);
	const lastInteraction = {
		question: {
			id: "q1",
			text: "A valid question?",
			required: true,
			type: "free_text",
		},
		answer: "A useful answer.",
	};
	for (const questionCount of [1, 10]) {
		assert.equal(
			InterviewRequestSchema.safeParse({
				...createRequest(),
				questionCount,
				lastInteraction,
			}).success,
			true,
		);
	}
	for (const questionCount of [-1, 11, 1.5]) {
		assert.equal(
			InterviewRequestSchema.safeParse({
				...createRequest(),
				questionCount,
				lastInteraction: questionCount === 0 ? null : lastInteraction,
			}).success,
			false,
		);
	}
	assert.equal(
		InterviewRequestSchema.safeParse({
			...createRequest(),
			questionCount: 1,
		}).success,
		false,
	);
});

test("bounds option, signal, like, and dislike arrays at their supported limits", () => {
	const response = createContinueResult();
	response.question.options = Array.from({ length: 8 }, (_, index) => createOption(index));
	response.tasteUpdate.signals = Array.from({ length: 20 }, () => createSignal());
	response.tasteUpdate.likes = Array.from({ length: 30 }, (_, index) => `Like ${index}`);
	response.tasteUpdate.dislikes = Array.from({ length: 30 }, (_, index) => `Dislike ${index}`);
	assert.equal(InterviewResponseSchema.safeParse(response).success, true);

	for (const overflow of [
		{ ...response, question: { ...response.question, options: [...response.question.options, createOption(8)] } },
		{ ...response, tasteUpdate: { ...response.tasteUpdate, signals: [...response.tasteUpdate.signals, createSignal()] } },
		{ ...response, tasteUpdate: { ...response.tasteUpdate, likes: [...response.tasteUpdate.likes, "one more"] } },
		{ ...response, tasteUpdate: { ...response.tasteUpdate, dislikes: [...response.tasteUpdate.dislikes, "one more"] } },
	]) {
		assert.equal(InterviewResponseSchema.safeParse(overflow).success, false);
	}
});

test("rejects blank and overlong user-facing text while accepting configured length boundaries", () => {
	const valid = createContinueResult();
	valid.question.id = "q".repeat(80);
	valid.question.text = "q".repeat(300);
	valid.question.options = [
		{ id: "o".repeat(80), label: "l".repeat(120), value: "v".repeat(120) },
		createOption(2),
	];
	valid.tasteUpdate.signals = [createSignal("story", "s".repeat(300))];
	valid.tasteUpdate.likes = ["l".repeat(200)];
	valid.tasteUpdate.dislikes = ["d".repeat(200)];
	assert.equal(InterviewResponseSchema.safeParse(valid).success, true);
	const maxLengthCompletion = createCompleteResult();
	maxLengthCompletion.personality.title = "t".repeat(80);
	maxLengthCompletion.personality.description = "d".repeat(600);
	assert.equal(InterviewResponseSchema.safeParse(maxLengthCompletion).success, true);

	const blankQuestion = createContinueResult();
	blankQuestion.question.text = "   ";
	const blankOption = createContinueResult();
	blankOption.question.options[0].label = "\t  ";
	const blankTaste = createContinueResult();
	blankTaste.tasteUpdate.signals = [createSignal("story", "\n")];
	const blankLike = createContinueResult();
	blankLike.tasteUpdate.likes = ["   "];
	const blankDislike = createContinueResult();
	blankDislike.tasteUpdate.dislikes = ["   "];
	const oversizedQuestion = createContinueResult();
	oversizedQuestion.question.text = "q".repeat(301);
	const oversizedOption = createContinueResult();
	oversizedOption.question.options[0].value = "v".repeat(121);
	const oversizedSignal = createContinueResult();
	oversizedSignal.tasteUpdate.signals = [createSignal("story", "s".repeat(301))];
	const oversizedLike = createContinueResult();
	oversizedLike.tasteUpdate.likes = ["l".repeat(201)];
	const oversizedDislike = createContinueResult();
	oversizedDislike.tasteUpdate.dislikes = ["d".repeat(201)];

	for (const response of [
		blankQuestion,
		blankOption,
		blankTaste,
		blankLike,
		blankDislike,
		oversizedQuestion,
		oversizedOption,
		oversizedSignal,
		oversizedLike,
		oversizedDislike,
	]) {
		assert.equal(InterviewResponseSchema.safeParse(response).success, false);
	}
});

test("rejects unknown top-level and nested response fields", () => {
	const valid = createContinueResult();
	const invalidResponses = [
		{ ...valid, unexpected: "untrusted" },
		{ ...valid, recommendations: [{ title: "untrusted recommendation" }] },
		{ ...valid, question: { ...valid.question, internalNote: "untrusted" } },
		{
			...valid,
			tasteUpdate: {
				...valid.tasteUpdate,
				signals: [{ ...createSignal(), recommendation: "untrusted" }],
			},
		},
		{ ...valid, confidence: { overall: 0.5, explanation: "untrusted" } },
		{ ...createCompleteResult(), personality: { ...createCompleteResult().personality, extra: true } },
	];
	for (const response of invalidResponses) {
		assert.equal(InterviewResponseSchema.safeParse(response).success, false);
	}
});

test("rejects malformed output as a safe application error", async () => {
	const service = createService({ status: "continue", confidence: { overall: 4 } });

	await assert.rejects(
		service.runInterview(createRequest()),
		(error) => error.code === "AI_SERVICE_ERROR" && error.statusCode === 502,
	);
	assert.equal(service.calls.length, 1);
	assert.equal(logEntries.at(-1)?.context?.issues?.length > 0, true);
});

test("service rejects blank generated text instead of returning unvalidated output", async () => {
	const invalidOutput = createContinueResult();
	invalidOutput.question.text = "   ";
	const service = createService(invalidOutput);

	await assert.rejects(
		service.runInterview(createRequest()),
		(error) => error.code === "AI_SERVICE_ERROR" && error.statusCode === 502,
	);
	assert.equal(service.calls.length, 1);
});

test("propagates provider failures without retrying or fabricating a result", async () => {
	const providerError = new Error("provider failure");
	const service = createService(providerError);

	await assert.rejects(
		service.runInterview(createRequest()),
		(error) => error === providerError,
	);
	assert.equal(service.calls.length, 1);
});

test("maps internal provider failures to safe application errors", async () => {
	const cases = [
		{ code: "RATE_LIMITED", status: 429 },
		{ code: "PROVIDER_UNAVAILABLE", status: 503 },
		{ code: "NETWORK_ERROR", status: 503 },
		{ code: "TIMEOUT", status: 503 },
		{ code: "AUTHENTICATION_ERROR", status: 502 },
		{ code: "INVALID_REQUEST", status: 502 },
	];

	for (const { code, status } of cases) {
		const service = createService(new FakeGeminiClientError(code));
		await assert.rejects(service.runInterview(createRequest()), (error) => {
			assert.equal(error.statusCode, status);
			assert.equal(error.code, status === 429 ? "RATE_LIMITED" : "AI_SERVICE_ERROR");
			assert.doesNotMatch(error.message, /private provider detail/);
			return true;
		});
		assert.equal(service.calls.length, 1);
	}
});
