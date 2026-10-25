import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);

function getRuntimePrompt() {
	const source = fs.readFileSync(
		path.join(root, "services/gemini/interview-prompt.ts"),
		"utf8",
	);
	const javascript = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText;
	const loadedModule = { exports: {} };
	new Function("require", "module", "exports", javascript)(
		() => {
			throw new Error("The runtime prompt must not have dependencies.");
		},
		loadedModule,
		loadedModule.exports,
	);
	return loadedModule.exports.GEMINI_INTERVIEW_SYSTEM_PROMPT;
}

const prompt = getRuntimePrompt();

test("runtime prompt exactly matches its authoritative source artifact", () => {
	const artifact = fs
		.readFileSync(
			path.join(root, ".projectinfo/Gemini Interview System Prompt.txt"),
			"utf8",
		)
		.replace(/\r\n/g, "\n");
	assert.equal(prompt, artifact);
});

test("prompt keeps all movie-taste areas optional and recommendation-relevant", () => {
	for (const dimension of [
		"story",
		"emotion",
		"characters",
		"genre",
		"tone",
		"pacing",
		"complexity",
		"themes",
		"visual_style",
		"ending",
		"preferences",
	]) {
		assert.ok(prompt.includes(`\`${dimension}\``), `missing dimension ${dimension}`);
	}
	assert.match(prompt, /Do \*\*not\*\* mechanically ask about every dimension/);
	assert.match(prompt, /uncertaint.{0,120}most useful/i);
});

test("prompt uses current interview state and asks one adaptive question", () => {
	assert.match(prompt, /current taste profile/i);
	assert.match(prompt, /latest interaction when one exists/i);
	assert.match(prompt, /identify what the user's answer reveals/i);
	assert.match(prompt, /exactly one question per continuing interview turn/i);
	assert.match(prompt, /Avoid repeating information that is already sufficiently understood/);
	assert.match(prompt, /Do not follow a fixed question sequence/);
});

test("selected vibes and anchor movie do not imply unsupported preferences", () => {
	assert.match(prompt, /selected vibe keywords are a hard scope/i);
	assert.match(prompt, /anchor movie is context only\. Never assume the user likes every characteristic/i);
	assert.match(prompt, /Do not invent preferences that the user has not demonstrated/i);
	assert.match(prompt, /Do not reduce nuanced answers to simple genre classifications/i);
});

test("anchor notes override assumptions about why the user likes the anchor and remain in the taste profile", () => {
	assert.match(prompt, /anchorNote.*explicit, high-priority explanation/i);
	assert.match(prompt, /prioritize the note over assumptions based on the anchor movie/i);
	assert.match(prompt, /preserve the note's explicit preference in the taste profile across every turn/i);
});

test("prompt handles vague and contradictory signals without inventing certainty", () => {
	assert.match(prompt, /do not invent a preference/i);
	assert.match(prompt, /Do not pretend that uncertainty is certainty/);
	assert.match(prompt, /Do not automatically discard either preference/);
	assert.match(prompt, /clarifying question/i);
	assert.match(prompt, /Explicit dislikes should be preserved/);
	assert.match(prompt, /confidence/i);
});

test("prompt cooperates with configured two-to-five limits", () => {
	assert.match(prompt, /MIN_QUESTIONS = 2/);
	assert.match(prompt, /MAX_QUESTIONS = 5/);
	assert.match(prompt, /Before 2 questions have been answered:[\s\S]*?do not mark the interview as complete/);
	assert.match(prompt, /application is responsible for enforcing the hard maximum of 5/i);
});

test("prompt separates recommendations and hidden reasoning from interview output", () => {
	assert.match(prompt, /Do \*\*not\*\* recommend movies during the interview/);
	assert.match(prompt, /Do not output:[\s\S]*?recommended movies[\s\S]*?recommendation lists/);
	assert.match(prompt, /Return \*\*only valid JSON\*\*/);
	assert.match(prompt, /Never invent fields that are not part of the application's schema/);
	assert.match(prompt, /Do not output chain-of-thought or internal reasoning/);
});

test("prompt requires a grounded, specific personality on completion", () => {
	assert.match(prompt, /personality title should be:[\s\S]*?memorable[\s\S]*?specific/);
	assert.match(prompt, /Do not exaggerate weak or uncertain signals/);
	assert.match(prompt, /a `personality` object with a specific `title` and concise `description`/);
	assert.match(prompt, /include the required `personality.title` and `personality.description` for a completed interview/);
});

test("prompt explicitly keeps generated values within application schema limits", () => {
	assert.match(prompt, /at most 20 distinct taste signals/);
	assert.match(prompt, /at most 30 likes and 30 dislikes/);
	assert.match(prompt, /taste signal value is at most 300 characters/);
	assert.match(prompt, /like or dislike is at most 200 characters/);
	assert.match(prompt, /question text within 300 characters/);
	assert.match(prompt, /provide 2 to 8 options/);
	assert.match(prompt, /personality title within 80 characters/);
	assert.match(prompt, /description within 600 characters/);
});
