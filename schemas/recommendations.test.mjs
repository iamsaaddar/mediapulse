import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);

function loadTypeScript(relativePath) {
	const source = fs.readFileSync(path.join(root, relativePath), "utf8");
	const javascript = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText;
	const loadedModule = { exports: {} };
	new Function("require", "module", "exports", javascript)(
		(moduleName) => {
			if (moduleName === "zod") return { z };
			if (moduleName === "@/constants/limits") return loadTypeScript("constants/limits.ts");
			if (moduleName === "@/constants/taste-dimensions") return loadTypeScript("constants/taste-dimensions.ts");
			if (moduleName === "./common") return loadTypeScript("schemas/common.ts");
			if (moduleName === "./interview") return loadTypeScript("schemas/interview.ts");
			if (moduleName === "./movie" || moduleName === "@/schemas/movie") return loadTypeScript("schemas/movie.ts");
			if (moduleName === "@/schemas/recommendations") return loadTypeScript("schemas/recommendations.ts");
			throw new Error(`Unexpected dependency in test loader: ${moduleName}`);
		},
		loadedModule,
		loadedModule.exports,
	);
	return loadedModule.exports;
}

const limits = loadTypeScript("constants/limits.ts");
const {
	RecommendationCandidateSchema,
	GeminiRecommendationOutputSchema,
	RecommendationConfidenceSchema,
	RecommendationPersonalitySchema,
	PersonalitySchema,
	RecommendationRequestSchema,
	RecommendedMovieItemSchema,
	RecommendationResponseSchema,
} = loadTypeScript("schemas/recommendations.ts");
const { VerifiedMovieSchema } = loadTypeScript("schemas/movie.ts");

function createValidTasteProfile() {
	return {
		signals: [
			{ dimension: "emotion", value: "bittersweet and poignant", confidence: 0.85 },
			{ dimension: "pacing", value: "slow burn with narrative momentum", confidence: 0.8 },
			{ dimension: "visual_style", value: "rich, atmospheric cinematography", confidence: 0.75 },
		],
		likes: ["emotionally layered dramas", "neo-noir mysteries", "character character studies"],
		dislikes: ["jump scares", "mean-spirited cynicism", "shallow exposition dumps"],
	};
}

function createValidPersonality() {
	return {
		title: "The Atmospheric Story Seeker",
		description: "You gravitate toward emotionally rich films with contemplative pacing, striking visual atmosphere, and complex psychological underpinnings.",
	};
}

function createValidRequest() {
	return {
		tasteProfile: createValidTasteProfile(),
		confidence: { overall: 0.82 },
		personality: createValidPersonality(),
	};
}

function createValidCandidate(index = 1) {
	return {
		title: `Recommendation Candidate ${index}`,
		year: 2010 + index,
		reason: `Matches your preference for atmospheric storytelling and nuanced character depth (candidate ${index}).`,
	};
}

function createValidMovie(tmdbId = 101) {
	return {
		tmdbId,
		title: `Verified Movie ${tmdbId}`,
		originalTitle: `Original Movie ${tmdbId}`,
		releaseDate: "2019-10-15",
		overview: "A thoughtful examination of human connection and quiet resilience amidst change.",
		posterPath: `/posters/movie-${tmdbId}.jpg`,
		backdropPath: `/backdrops/movie-${tmdbId}.jpg`,
		rating: 8.4,
		voteCount: 4250,
		genreIds: [18, 9648],
		originalLanguage: "en",
	};
}

function createValidResponse() {
	return {
		personality: createValidPersonality(),
		recommendations: [1, 2, 3, 4, 5].map((index) => ({
			reason: `Personalized reason tailored to your cinematic preferences for film ${index}.`,
			movie: createValidMovie(100 + index),
		})),
	};
}

test("accepts valid completed Phase 6 interview state as a recommendation request", () => {
	const request = createValidRequest();
	const parsed = RecommendationRequestSchema.safeParse(request);
	assert.equal(parsed.success, true);
	assert.deepEqual(parsed.data, request);
});

test("rejects recommendation requests with missing required top-level fields", () => {
	const base = createValidRequest();
	for (const key of ["tasteProfile", "confidence", "personality"]) {
		const incomplete = { ...base };
		delete incomplete[key];
		const parsed = RecommendationRequestSchema.safeParse(incomplete);
		assert.equal(parsed.success, false, `Expected failure when omitting ${key}`);
	}
});

test("validates confidence bounds and enforces overall wrapper structure", () => {
	const base = createValidRequest();

	assert.equal(RecommendationConfidenceSchema.safeParse({ overall: 0 }).success, true);
	assert.equal(RecommendationConfidenceSchema.safeParse({ overall: 1 }).success, true);
	assert.equal(RecommendationConfidenceSchema.safeParse({ overall: 0.5 }).success, true);

	for (const badConfidence of [
		{ overall: -0.01 },
		{ overall: 1.01 },
		{ overall: Number.NaN },
		{ overall: Number.POSITIVE_INFINITY },
		{ overall: "0.8" },
		{ overall: null },
		{ overall: undefined },
		0.8,
		{},
	]) {
		const parsed = RecommendationRequestSchema.safeParse({ ...base, confidence: badConfidence });
		assert.equal(parsed.success, false, `Expected failure for confidence: ${JSON.stringify(badConfidence)}`);
	}
});

test("validates personality fields and enforces Phase 6 bounds", () => {
	const base = createValidRequest();

	for (const badTitle of ["", "   ", "\t\n", "a".repeat(limits.MAX_PERSONALITY_TITLE_LENGTH + 1), null, 123]) {
		const parsed = RecommendationRequestSchema.safeParse({
			...base,
			personality: { ...base.personality, title: badTitle },
		});
		assert.equal(parsed.success, false, `Expected failure for personality title: ${String(badTitle)}`);
	}

	for (const badDesc of ["", "   ", "a".repeat(limits.MAX_PERSONALITY_DESCRIPTION_LENGTH + 1), null, 456]) {
		const parsed = RecommendationRequestSchema.safeParse({
			...base,
			personality: { ...base.personality, description: badDesc },
		});
		assert.equal(parsed.success, false, `Expected failure for personality description: ${String(badDesc)}`);
	}

	assert.equal(PersonalitySchema, RecommendationPersonalitySchema);
});

test("rejects obsolete traits property in personality and rejects unknown properties (strictness)", () => {
	const base = createValidRequest();

	const withTraits = {
		...base,
		personality: {
			...base.personality,
			traits: ["Introspective", "Atmospheric"],
		},
	};
	assert.equal(RecommendationRequestSchema.safeParse(withTraits).success, false);

	const withTopLevelExtra = { ...base, extraProperty: "unauthorized" };
	assert.equal(RecommendationRequestSchema.safeParse(withTopLevelExtra).success, false);

	const withConfidenceExtra = { ...base, confidence: { overall: 0.8, extra: true } };
	assert.equal(RecommendationRequestSchema.safeParse(withConfidenceExtra).success, false);

	const withTasteExtra = {
		...base,
		tasteProfile: { ...base.tasteProfile, extraDimension: "director" },
	};
	assert.equal(RecommendationRequestSchema.safeParse(withTasteExtra).success, false);

	const withSignalExtra = {
		...base,
		tasteProfile: {
			...base.tasteProfile,
			signals: [{ ...base.tasteProfile.signals[0], internalTag: "vague" }],
		},
	};
	assert.equal(RecommendationRequestSchema.safeParse(withSignalExtra).success, false);
});

test("validates taste profile dimensions, array lengths, and item bounds", () => {
	const base = createValidRequest();

	const invalidDimension = {
		...base,
		tasteProfile: {
			...base.tasteProfile,
			signals: [{ dimension: "director", value: "David Lynch", confidence: 0.9 }],
		},
	};
	assert.equal(RecommendationRequestSchema.safeParse(invalidDimension).success, false);

	const excessiveSignals = {
		...base,
		tasteProfile: {
			...base.tasteProfile,
			signals: Array.from({ length: limits.MAX_TASTE_SIGNALS + 1 }, (_, i) => ({
				dimension: "story",
				value: `Signal ${i}`,
				confidence: 0.5,
			})),
		},
	};
	assert.equal(RecommendationRequestSchema.safeParse(excessiveSignals).success, false);

	const excessiveLikes = {
		...base,
		tasteProfile: {
			...base.tasteProfile,
			likes: Array.from({ length: limits.MAX_TASTE_LIST_ITEMS + 1 }, (_, i) => `Like ${i}`),
		},
	};
	assert.equal(RecommendationRequestSchema.safeParse(excessiveLikes).success, false);

	const overlongItem = {
		...base,
		tasteProfile: {
			...base.tasteProfile,
			likes: ["a".repeat(limits.MAX_TASTE_LIST_ITEM_LENGTH + 1)],
		},
	};
	assert.equal(RecommendationRequestSchema.safeParse(overlongItem).success, false);

	const blankLike = {
		...base,
		tasteProfile: {
			...base.tasteProfile,
			likes: ["   "],
		},
	};
	assert.equal(RecommendationRequestSchema.safeParse(blankLike).success, false);
});

test("validates RecommendationCandidateSchema with bounded title, reason, and nullable year", () => {
	assert.equal(RecommendationCandidateSchema.safeParse(createValidCandidate(1)).success, true);

	const nullableYear = { ...createValidCandidate(1), year: null };
	assert.equal(RecommendationCandidateSchema.safeParse(nullableYear).success, true);

	for (const badCandidate of [
		{ ...createValidCandidate(1), title: "" },
		{ ...createValidCandidate(1), title: "   " },
		{ ...createValidCandidate(1), title: "a".repeat(limits.MAX_CANDIDATE_TITLE_LENGTH + 1) },
		{ ...createValidCandidate(1), year: 1887 },
		{ ...createValidCandidate(1), year: 2101 },
		{ ...createValidCandidate(1), year: 2015.5 },
		{ ...createValidCandidate(1), reason: "" },
		{ ...createValidCandidate(1), reason: "   " },
		{ ...createValidCandidate(1), reason: "a".repeat(limits.MAX_RECOMMENDATION_REASON_LENGTH + 1) },
		{ ...createValidCandidate(1), unexpected: "extra" },
	]) {
		assert.equal(RecommendationCandidateSchema.safeParse(badCandidate).success, false);
	}

	const omittedYear = { title: "Movie", reason: "Good movie" };
	assert.equal(RecommendationCandidateSchema.safeParse(omittedYear).success, false);
});

test("validates GeminiRecommendationOutputSchema candidate pool boundary of 7 to 8 candidates", () => {
	const candidates7 = Array.from({ length: 7 }, (_, i) => createValidCandidate(i + 1));
	const candidates8 = Array.from({ length: 8 }, (_, i) => createValidCandidate(i + 1));
	const candidates6 = Array.from({ length: 6 }, (_, i) => createValidCandidate(i + 1));
	const candidates9 = Array.from({ length: 9 }, (_, i) => createValidCandidate(i + 1));

	assert.equal(GeminiRecommendationOutputSchema.safeParse({ candidates: candidates7 }).success, true);
	assert.equal(GeminiRecommendationOutputSchema.safeParse({ candidates: candidates8 }).success, true);

	assert.equal(GeminiRecommendationOutputSchema.safeParse({ candidates: candidates6 }).success, false);
	assert.equal(GeminiRecommendationOutputSchema.safeParse({ candidates: candidates9 }).success, false);
	assert.equal(GeminiRecommendationOutputSchema.safeParse({ candidates: candidates7, extraField: true }).success, false);
});

test("validates VerifiedMovieSchema fields, bounds, nullability, and strictness", () => {
	const valid = createValidMovie(42);
	assert.equal(VerifiedMovieSchema.safeParse(valid).success, true);

	const nullImages = { ...valid, posterPath: null, backdropPath: null };
	assert.equal(VerifiedMovieSchema.safeParse(nullImages).success, true);

	for (const badMovie of [
		{ ...valid, tmdbId: 0 },
		{ ...valid, tmdbId: -1 },
		{ ...valid, tmdbId: 1.5 },
		{ ...valid, title: "" },
		{ ...valid, title: "   " },
		{ ...valid, title: "a".repeat(limits.MAX_MOVIE_TITLE_LENGTH + 1) },
		{ ...valid, originalTitle: "" },
		{ ...valid, releaseDate: "12345678901" },
		{ ...valid, overview: "a".repeat(limits.MAX_MOVIE_OVERVIEW_LENGTH + 1) },
		{ ...valid, rating: -0.1 },
		{ ...valid, rating: 10.1 },
		{ ...valid, voteCount: -1 },
		{ ...valid, voteCount: 10.5 },
		{ ...valid, genreIds: [-5] },
		{ ...valid, genreIds: Array.from({ length: limits.MAX_MOVIE_GENRES + 1 }, (_, i) => i + 1) },
		{ ...valid, originalLanguage: "" },
		{ ...valid, originalLanguage: "a".repeat(limits.MAX_MOVIE_LANGUAGE_LENGTH + 1) },
		{ ...valid, extraField: "disallowed" },
	]) {
		assert.equal(VerifiedMovieSchema.safeParse(badMovie).success, false);
	}

	const missingPoster = { ...valid };
	delete missingPoster.posterPath;
	assert.equal(VerifiedMovieSchema.safeParse(missingPoster).success, false);
});

test("validates RecommendedMovieItemSchema fields, bounds, and strictness", () => {
	const validItem = {
		reason: "A deeply resonant story that matches your contemplative taste.",
		movie: createValidMovie(201),
	};
	assert.equal(RecommendedMovieItemSchema.safeParse(validItem).success, true);

	for (const badItem of [
		{ ...validItem, reason: "" },
		{ ...validItem, reason: "   " },
		{ ...validItem, reason: "a".repeat(limits.MAX_RECOMMENDATION_REASON_LENGTH + 1) },
		{ ...validItem, unexpectedField: true },
	]) {
		assert.equal(RecommendedMovieItemSchema.safeParse(badItem).success, false);
	}

	const missingMovie = { reason: validItem.reason };
	assert.equal(RecommendedMovieItemSchema.safeParse(missingMovie).success, false);
});

test("validates RecommendationResponseSchema requires exactly 5 recommendations", () => {
	const valid = createValidResponse();
	assert.equal(RecommendationResponseSchema.safeParse(valid).success, true);

	const fourItems = {
		...valid,
		recommendations: valid.recommendations.slice(0, 4),
	};
	assert.equal(RecommendationResponseSchema.safeParse(fourItems).success, false);

	const sixItems = {
		...valid,
		recommendations: [
			...valid.recommendations,
			{
				reason: "Extra recommendation item.",
				movie: createValidMovie(999),
			},
		],
	};
	assert.equal(RecommendationResponseSchema.safeParse(sixItems).success, false);

	const missingPersonality = { recommendations: valid.recommendations };
	assert.equal(RecommendationResponseSchema.safeParse(missingPersonality).success, false);

	const withExtraRoot = { ...valid, extra: "untrusted" };
	assert.equal(RecommendationResponseSchema.safeParse(withExtraRoot).success, false);

	const withExtraItem = {
		...valid,
		recommendations: [
			{ ...valid.recommendations[0], extraProperty: "bad" },
			...valid.recommendations.slice(1),
		],
	};
	assert.equal(RecommendationResponseSchema.safeParse(withExtraItem).success, false);
});

test("rejects duplicate TMDB movie IDs in RecommendationResponseSchema", () => {
	const valid = createValidResponse();
	const duplicateIds = {
		...valid,
		recommendations: [
			valid.recommendations[0],
			{
				reason: "Another reason for the exact same movie.",
				movie: { ...valid.recommendations[0].movie },
			},
			valid.recommendations[2],
			valid.recommendations[3],
			valid.recommendations[4],
		],
	};

	const parsed = RecommendationResponseSchema.safeParse(duplicateIds);
	assert.equal(parsed.success, false);
	const issue = parsed.error.issues.find(
		(item) => item.message && /duplicate movie recommendation with tmdb id/i.test(item.message),
	);
	assert.ok(issue, "Expected validation issue identifying duplicate TMDB ID");
});
