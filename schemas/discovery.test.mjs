import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function load(relative, cache = new Map()) {
	const normalized = relative.replaceAll("\\", "/"); const absolute = path.resolve(root, normalized);
	if (cache.has(absolute)) return cache.get(absolute).exports;
	const js = ts.transpileModule(fs.readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
	const mod = { exports: {} }; cache.set(absolute, mod);
	new Function("require", "module", "exports", js)((name) => {
		if (name === "zod") return { z };
		if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`, cache);
		if (name.startsWith(".")) return load(`${path.posix.normalize(path.posix.join(path.posix.dirname(normalized), name))}.ts`, cache);
		throw new Error(`Unexpected dependency: ${name}`);
	}, mod, mod.exports);
	return mod.exports;
}

const { DiscoveryPlanSchema } = load("schemas/discovery.ts");
const lanes = [
	{ strategy: "core_taste", genreNames: ["Drama"], keywordConcepts: ["dreamlike"], languageCodes: ["fr"], decades: [1990] },
	{ strategy: "thematic_exploration", genreNames: ["Mystery"], keywordConcepts: ["isolation"], languageCodes: [], decades: [] },
	{ strategy: "international_exploration", genreNames: [], keywordConcepts: ["identity"], languageCodes: ["ja"], decades: [] },
	{ strategy: "era_exploration", genreNames: ["Drama"], keywordConcepts: ["memory"], languageCodes: [], decades: [1970] },
];

test("validates usable lanes and requires only a grounded core taste lane", () => {
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes }).success, true);
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: [lanes[0]] }).success, true);
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: [lanes[1]] }).success, false);
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: lanes.map((lane) => ({ ...lane, genreNames: ["Made Up"] })) }).success, false);
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: lanes.map((lane) => ({ ...lane, languageCodes: ["xx"] })) }).success, false);
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: lanes.map((lane) => ({ ...lane, extra: true })) }).success, false);
	const languageOnly = { ...lanes[0], genreNames: [], keywordConcepts: [], languageCodes: ["fr"] };
	const decadeOnly = { ...lanes[0], genreNames: [], keywordConcepts: [], decades: [1990] };
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: [languageOnly] }).success, true);
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: [decadeOnly] }).success, true);
});

test("rejects lanes with no usable criterion and duplicate criteria", () => {
	const noCriteriaCore = { ...lanes[0], genreNames: [], keywordConcepts: [], languageCodes: [], decades: [] };
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: [noCriteriaCore] }).success, false);
	const emptyCore = { ...lanes[0], genreNames: [], keywordConcepts: [], languageCodes: [], decades: [] };
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: [emptyCore] }).success, false);
	assert.equal(DiscoveryPlanSchema.safeParse({ lanes: lanes.map((lane, i) => i === 0 ? { ...lane, keywordConcepts: ["dreamlike", "dreamlike"] } : lane) }).success, false);
});
