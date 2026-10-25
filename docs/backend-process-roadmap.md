# MediaPulse backend process roadmap

This document describes the implemented anchor-to-results backend flow.

```text
Anchor movie
  -> Gemini extracts granular vibe keywords
  -> user selects vibes, optional TMDB genres, decades, and languages
  -> Gemini runs a short adaptive interview inside those choices
  -> recommendation request contains interview taste profile + filters
  -> Gemini creates a typed discovery plan (search concepts and lanes)
  -> backend validates the plan and resolves keyword concepts using TMDB
  -> bounded, multi-lane TMDB Discover requests build a candidate pool
  -> backend deduplicates and re-applies the user's hard filters
  -> Gemini selects exactly seven IDs from that pool and explains each fit
  -> backend verifies the seven IDs/details against TMDB and returns them
```

## Taste profile and interview

The quiz begins with an anchor movie and an optional note explaining what the user values about it, then obtains vibe tags through `/api/vibes`. The note stays with the movie in `preferences.anchorNote`; it is sent on every interview turn and with the final recommendation request. The app also preserves it in the taste profile's likes so later Gemini updates cannot accidentally drop the explicit preference. The user selects vibes, may select one or more of TMDB's movie genres, and may choose decades and original-language codes. Interview answers update structured likes, dislikes, signals, confidence, and personality. The client holds the interview state; there is no account or persistent recommendation history.

The recommendation endpoint receives that completed state through `/api/recommendations`. The anchor title is context; the optional anchor note states what the user wants MediaPulse to understand about it, and is preserved in both preferences and the evolving taste profile. The selected vibes and interview profile also express taste. Genre, decade, and language selections remain authoritative hard constraints. A movie must contain every selected genre ID (AND semantics across selections); additional genres are allowed. Each selected decade is considered as its own era, and an explicitly selected language must match TMDB's `original_language`. An empty filter means no restriction for that dimension.

## Discovery plan and translation

`services/gemini/recommendations.ts` asks Gemini for a structured plan validated by `schemas/discovery.ts`. A plan contains one to eight lanes and must include a usable core-taste lane. Additional thematic, international, era, or adjacent lanes are included when supported by the profile. It contains only TMDB genre names, supported language codes, known decade values, and natural-language keyword concepts; Gemini does not supply catalog IDs, URLs, or API parameters.

`services/recommendations/discovery-plan.ts` maps genre names to the static TMDB genre catalog. If the user selected genres, all selected genre IDs are preserved as required AND criteria; Gemini cannot narrow or replace them. TMDB `/discover/movie` receives the IDs comma-separated, which applies AND semantics. It creates alternative query combinations for exploratory criteria instead of requiring every keyword to match together. User-selected decades and languages override exploratory values from the plan, then each decade, language, and keyword concept becomes a separate query alternative where needed. Each keyword concept is independently resolved by `services/tmdb/keywords.ts` using TMDB `/search/keyword`; only an exact catalog label match is used, and unresolved concepts are skipped. No invented keyword IDs are sent to Discover.

## Candidate pool, limits, and selection

`services/tmdb/discover.ts` calls `/discover/movie` with supported genre, keyword, original-language, release-date, and page parameters. Each request uses one decade and one original language at most; multiple selected values are handled through separate alternatives. Equivalent filter sets are deduplicated even when their lane labels or sort order differ. Every query explicitly sorts by release date or original title; it does not sort by popularity, vote count, or rating. The orchestrator interleaves complementary lanes, pages within a bounded request budget (24 TMDB discovery calls, at most six pages per planned query), deduplicates by TMDB ID, and targets roughly 100 candidates up to a cap of 160. It retains each candidate's discovery strategies, matched criteria, and resolved TMDB keyword concepts in memory for Gemini's candidate summaries and diagnostic logging.

The backend rechecks selected genres, decades, and languages against candidate metadata. If the bounded search returns fewer than seven eligible films, it returns the existing safe insufficient-results state instead of weakening a selected filter or padding with arbitrary films. TMDB details are fetched only for Gemini's final seven.

Gemini receives the profile and compact summaries from the eligible candidate pool (ID, canonical title, year/date, overview, genres, language). The selection schema requires exactly seven distinct IDs and personalized reasons. Application code checks every ID against the supplied pool and retries once if the output is malformed or contains an outside ID. It then fetches canonical TMDB details for the selected IDs and rechecks the hard filters. Ratings and vote counts may be returned to the existing display card from TMDB details, but they are not sent to Gemini or used for eligibility, ordering, or selection.

The backend has no cross-request history, so it prevents repeats within a response but cannot avoid a movie recommended during a previous session. No database or paid API was added.

## Main code map

| Responsibility | Entry points |
| --- | --- |
| Vibes and preference UI | `app/api/vibes/route.ts`, `services/gemini/vibes.ts`, `components/interview/PreferenceSetup.tsx` |
| Adaptive interview | `app/api/interview/route.ts`, `services/gemini/interview.ts`, `services/gemini/interview-prompt.ts` |
| Recommendation API | `app/api/recommendations/route.ts`, `services/recommendations/orchestrator.ts` |
| Gemini discovery plan and final selection | `services/gemini/recommendations.ts`, `services/gemini/recommendation-prompt.ts`, `schemas/discovery.ts`, `schemas/recommendations.ts` |
| Taste-to-TMDB translation | `services/recommendations/discovery-plan.ts`, `constants/movie-genres.ts`, `constants/preferences.ts` |
| TMDB discovery and keyword resolution | `services/tmdb/discover.ts`, `services/tmdb/keywords.ts`, `services/tmdb/client.ts` |
| Canonical movie metadata | `services/tmdb/movie.ts`, `schemas/movie.ts` |
| Tests | `services/recommendations/pipeline.test.mjs`, `services/tmdb/discover.test.mjs`, `schemas/discovery.test.mjs`, `schemas/recommendations.test.mjs` |
