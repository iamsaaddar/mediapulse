# MediaPulse backend process

This document describes the current implementation in the repository. The request handlers are thin boundaries; Gemini handles taste interpretation and candidate selection, TMDB provides catalog data, and application code enforces schemas and hard constraints.

## End-to-end flow

```text
Browser: /quiz
  -> POST /api/vibes { movieTitle }
  -> schemas/vibes.ts validates request and response
  -> services/gemini/vibes.ts asks Gemini for 10–15 distinct vibe descriptors
  -> user selects vibes and optional genre IDs, decades, languages
  -> POST /api/interview for each turn
  -> schemas/interview.ts validates request/response
  -> services/gemini/interview.ts sends compact preferences, profile, and latest interaction
  -> application enforces the 2–5 answer bounds
  -> client builds the final recommendation request
  -> recommendation handoff shows pending/error/success and supports retry
  -> POST /api/recommendations
  -> schemas/recommendations.ts validates request
  -> services/recommendations/orchestrator.ts prepares an eligible candidate pool
  -> Gemini discovery plan -> schemas/discovery.ts
  -> genre mapping + exact TMDB keyword resolution
  -> bounded, deduplicated TMDB Discover queries
  -> hard-filter checks against candidate metadata
  -> Gemini selects seven unique IDs from the pool (one retry for invalid output)
  -> fetch canonical TMDB details for selected IDs
  -> recheck selected filters and validate final response
  -> client displays personality and seven interactive DVD cases
```

## API route responsibilities

| Route | Implementation | Behavior |
| --- | --- | --- |
| `GET /api/health` | `app/api/health/route.ts` | Returns `{ status: "ok", service: "mediapulse" }` |
| `POST /api/vibes` | `app/api/vibes/route.ts` | Accepts a movie title; returns Gemini-generated descriptors |
| `POST /api/interview` | `app/api/interview/route.ts` | Accepts compact state; returns `continue` with one question or `complete` with taste profile, confidence, and personality |
| `POST /api/recommendations` | `app/api/recommendations/route.ts` | Orchestrates discovery, filtering, selection, canonical details, and response validation |

POST handlers parse JSON, validate input using Zod, map known `AppError` values to status/code/message, and return safe structured errors. Unexpected failures are logged and exposed to the client through generic messages. Gemini credentials and TMDB credentials are accessed server-side.

## Anchor, vibe selection, and interview state

The client starts at `/quiz`. The user enters an anchor movie title and can write an optional note, up to 200 characters, about what they value in the film. `/api/vibes` currently receives only the title; the note is carried into interview preferences and the final recommendation request. Gemini returns 10–15 unique descriptors across supported categories: atmosphere, emotion, micro-genre, trope, pacing, and visual style.

The user must select at least one vibe. Genre filters are optional; if several are selected, every selected genre must be present in an eligible movie. Decades and original-language filters are also optional. An empty group means unrestricted for that dimension. The interview receives the complete preference state, including selected genres, vibes, decade and language selections, but the interview system prompt explicitly scopes questions to selected vibes and, when present, selected genres.

Interview requests contain the question count, preferences, current taste profile, and latest interaction. The client stores questions, answers, preferences, personality and profile in component state. The backend sends compact structured state to Gemini and validates the response with `InterviewResponseSchema`. The first request asks Gemini for a question; subsequent requests include the latest answer. At least two answers are required, and the fifth answered turn must complete. Repeated question IDs are also rejected in the client flow. There is no account, database, or persisted session history.

The optional anchor note is preserved in the evolving taste profile as explicit user evidence so Gemini does not infer that the user likes every aspect of the anchor film. The note is included in recommendation planning and selection context.

## Discovery plan and query translation

`services/gemini/recommendations.ts` asks Gemini for a structured plan validated by `schemas/discovery.ts`. The plan contains up to eight usable lanes with supported genre names, decade values, language codes, and natural-language keyword concepts. Gemini does not provide TMDB IDs or raw API parameters.

`services/recommendations/discovery-plan.ts` maps names through `constants/movie-genres.ts`. If the user selected genres, those exact IDs are required as an AND set and override exploratory genres from Gemini. Selected decades and languages likewise override plan suggestions. Each selected decade, language, and resolved keyword is expanded into separate query alternatives where needed, so a multi-value selection does not accidentally require all those alternatives at once.

`services/tmdb/keywords.ts` resolves each keyword concept through TMDB `/search/keyword`. A keyword is accepted only if its catalog name exactly matches the concept after trimming and case folding. Unresolved concepts are skipped; the app never invents keyword IDs. Queries with no supported criterion are discarded. Equivalent filter sets are deduplicated even if their sort choice differs, and source-lane provenance is merged for diagnostics and Gemini selection context.

## Candidate discovery, hard filters, and selection

`services/recommendations/orchestrator.ts` interleaves complementary planned queries under these bounds:

- At most 24 TMDB Discover requests per recommendation attempt.
- At most six pages per planned query.
- Target pool: 100 candidates; hard maximum: 160.
- At most eight plan lanes and 12 unique keyword concepts for resolution.

Discovery sorts by release date or original title, not popularity, vote count, or rating. Candidates are deduplicated by TMDB ID. The application checks every candidate against selected hard filters: all selected genre IDs must be present; a selected decade must match the release year's decade; and a selected language must match `original_language`.

If fewer than seven eligible candidates remain after bounded discovery, the orchestrator returns `INSUFFICIENT_RESULTS` and asks the user to broaden filters. It does not weaken constraints or ask Gemini to invent substitutes. Gemini receives compact summaries of eligible candidates, including TMDB ID, title, release information, overview, genres, language, and matched keyword provenance. The selection schema requires exactly seven distinct IDs and a personalized reason for each. Application code checks IDs against the actual pool and retries once if output is invalid or references outside IDs.

For the seven selected IDs, the backend fetches canonical details from TMDB and validates them against `VerifiedMovieSchema`. It checks the IDs and selected hard filters again, then validates the final response with `RecommendationResponseSchema`. Ratings and vote counts are included in returned metadata for display only; they do not affect eligibility, ordering, or selection. Repeat avoidance applies within one response only because there is no persistent history.

## Error and provider behavior

The Gemini client is in `services/gemini/client.ts`. It uses structured output for schema-based operations, normalizes provider failures, retries eligible transient failures within a two-attempt limit, and logs operation/category/attempt metadata without logging prompts or generated content. The interview and recommendation services map provider errors to safe application errors. TMDB discovery lane failures are logged and other lanes may continue; rate limiting stops further expansion. If the final candidate pool is insufficient, the API returns a clear 422-style error rather than weakening filters.

## Code map

| Responsibility | Main files |
| --- | --- |
| Browser flow and local state | `app/quiz/page.tsx`, `lib/recommendation-handoff.ts` |
| Landing and layout | `app/page.tsx`, `app/layout.tsx`, `components/landing/` |
| Vibe extraction | `app/api/vibes/route.ts`, `services/gemini/vibes.ts`, `schemas/vibes.ts` |
| Adaptive interview | `app/api/interview/route.ts`, `services/gemini/interview.ts`, `services/gemini/interview-prompt.ts`, `schemas/interview.ts` |
| Recommendation endpoint | `app/api/recommendations/route.ts`, `services/recommendations/orchestrator.ts` |
| Discovery plan and selection | `services/gemini/recommendations.ts`, `services/gemini/recommendation-prompt.ts`, `schemas/discovery.ts`, `schemas/recommendations.ts` |
| TMDB query translation and filtering | `services/recommendations/discovery-plan.ts`, `constants/movie-genres.ts`, `constants/preferences.ts` |
| TMDB API access | `services/tmdb/client.ts`, `services/tmdb/keywords.ts`, `services/tmdb/discover.ts`, `services/tmdb/movie.ts` |
| Client request contracts | `lib/vibes-api.ts`, `lib/interview-api.ts`, `lib/recommendation-api.ts` |
| Result UI | `components/interview/InterviewCompletion.tsx`, `components/results/ResultsExperience.tsx`, `components/results/MovieCard.tsx`, `components/results/results.module.css` |
| Runtime contracts and types | `schemas/`, `types/` |
| Automated tests | `*.test.mjs` files beside routes, schemas, services, and `lib/` |

## Local verification

Use `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. `GET /api/health` is a useful smoke check, but does not validate Gemini or TMDB credentials, live provider behavior, or the complete browser journey.
