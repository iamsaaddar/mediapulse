import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function load(relativePath) {
	const source = fs.readFileSync(path.join(root, relativePath), "utf8");
	const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
	const loadedModule = { exports: {} };
	new Function("require", "module", "exports", javascript)((specifier) => {
		if (specifier === "@/constants/limits") return { MAX_TASTE_LIST_ITEMS: 30 };
		throw new Error(`Unexpected dependency: ${specifier}`);
	}, loadedModule, loadedModule.exports);
	return loadedModule.exports;
}

const { preserveAnchorNote } = load("lib/anchor-note.ts");

test("anchor note stays first in the evolving taste profile and respects profile limits", () => {
	const note = "I want more films adapted from novels.";
	const profile = { signals: [], likes: ["mystery", note, "character-driven stories"], dislikes: [] };
	const result = preserveAnchorNote(profile, note);
	assert.deepEqual(result.likes, [note, "mystery", "character-driven stories"]);
	assert.deepEqual(profile.likes, ["mystery", note, "character-driven stories"]);

	const fullProfile = { signals: [], likes: Array.from({ length: 30 }, (_, index) => `Like ${index}`), dislikes: [] };
	const bounded = preserveAnchorNote(fullProfile, note);
	assert.equal(bounded.likes.length, 30);
	assert.equal(bounded.likes[0], note);
	assert.equal(bounded.likes.includes("Like 29"), false);
});

test("empty optional anchor notes do not change the taste profile", () => {
	const profile = { signals: [], likes: ["quiet stories"], dislikes: [] };
	assert.equal(preserveAnchorNote(profile, "  "), profile);
});
