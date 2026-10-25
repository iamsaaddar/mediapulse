# MediaPulse — Current Project Reference

**Reference date:** 2026-10-20  
**Project state:** The anchor-vibe interview and TMDB-first candidate discovery flow is implemented in the repository.
**Authority:** This file supersedes old “current task,” phase, and next-step instructions in the historical handoff and roadmap documents in this folder.

## Product

MediaPulse is a movie discovery experience that starts from an anchor film and an optional note explaining what the viewer values about it, then lets a viewer select granular vibes, optional hard TMDB genre filters, and decade/language filters before using a short adaptive interview to refine a taste profile and personality. The note is preserved in preferences and the evolving taste profile. Gemini creates a typed search plan, TMDB discovers the eligible candidate pool, and Gemini selects seven personalized films from that pool. Popularity, vote counts, and ratings do not affect candidate selection or ordering.

V1 is movie-only, has no login, database, user accounts, or social features, and keeps Gemini and TMDB credentials on the server. The experience has a cinematic theater visual identity, an adaptive interview, a moviegoer personality card, and interactive DVD case recommendation cards.

## User journey and routes

1. `/` presents the landing page and explains the movie discovery experience.
2. `/quiz` begins with an anchor title and an optional note about what the user values in it; `/api/vibes` returns 10–15 Gemini-generated keywords for user selection, followed by optional TMDB genre filters, decade, and language filters.
3. `/api/interview` asks adaptive questions within selected vibes and, when chosen, selected genres. The application requires at least two answers and allows at most five. Completion provides a profile, confidence, and personality.
4. `/api/recommendations` receives the profile and preferences, validates a Gemini discovery plan, translates it to bounded TMDB Discover queries, enforces genre/decade/original-language filters, and has Gemini select exactly seven distinct verified movies from the candidate pool.
5. `/api/health` remains a small service health response. The results screen presents the personality and seven verified movie cards and supports recommendation retry or retaking the experience.

Interview state and results are held in browser memory; there is no persistence layer.

## Architecture map

- `app/`: App Router pages, global styles, metadata, and API routes.
- `components/landing/`: landing hero, how-it-works section, and CTA.
- `components/interview/`: anchor/vibe/filter setup, theater interview shell, typed question controls, validation feedback, progress, and completion wrapper.
- `components/results/`: personality reveal, movie artwork fallback, and interactive movie cases.
- `components/ui/`: shared buttons, containers, status/error UI, progress, header, and spinner.
- `services/gemini/`: server-only Gemini client, vibe extraction, adaptive interview policy/service, and discovery-plan/final-selection requests.
- `services/tmdb/`: TMDB request client, keyword catalog resolution, Discover queries, and canonical movie details.
- `services/recommendations/`: taste-to-TMDB query translation, bounded multi-lane discovery, ID de-duplication, hard filtering, Gemini selection validation, and final metadata verification.
- `schemas/`: Zod runtime contracts; `types/` infers TypeScript types from those contracts.
- `lib/`: environment validation, safe API clients, answer/limit rules, error types, logging, and one-shot recommendation handoff.
- `config/` and `constants/`: model defaults, 2–5 interview bounds, supported decades/languages/TMDB genres, taste dimensions, and input/output limits.
- `*.test.mjs`: Node test suites for API routes, schemas, client adapters, prompts, TMDB discovery/keyword translation, TMDB verification, and recommendation orchestration.

## Request and validation boundaries

- Product POST routes parse JSON, validate requests with Zod, and return a consistent `{ error: { code, message } }` shape for failures.
- Interview responses are discriminated as `continue` or `complete`. The server and client enforce the 2–5 answer bounds; duplicate question IDs are rejected in the browser flow.
- Gemini structured output is projected from Zod JSON Schema into the provider's supported schema shape and then validated again against the full application schema.
- The Gemini client is server-only, uses `GEMINI_API_KEY`, classifies provider failures, redacts key-like details, and retries only transient failures with a bounded retry count.
- Recommendation generation asks Gemini for a typed discovery plan; the backend maps catalog genre names to static TMDB IDs and resolves keyword concepts through TMDB `/search/keyword` exact-name matches. It interleaves complementary `/discover/movie` lanes with a 24-request cap, six-page per-query cap, 100-candidate target, and 160-candidate ceiling. Candidate IDs are deduplicated and selected genre, decade, and language constraints are rechecked. Gemini chooses seven unique IDs from the actual pool; the application checks IDs, retries invalid output once, fetches canonical details for those seven, and rechecks filters. Popularity, vote counts, and ratings do not influence eligibility, ordering, or selection. No persistent history exists, so repeat avoidance is limited to one response.
- `TMDB_API_KEY` is read on the server. Movie artwork is sourced from `image.tmdb.org`; the Next image configuration allows that host, while the component currently requests images without Next optimization.
- The interview system prompt source lives in this folder and is copied into `services/gemini/interview-prompt.ts`; that source file explicitly requires them to stay synchronized. Runtime guidance also clarifies that conceptual prompt dimensions must map to the schema's supported enum.

## Stack and commands

The checked-in package manifest specifies Next.js `16.3.5`, React `19.2.8`, TypeScript 5, Tailwind CSS 4, Zod 4, and `@google/genai` 2.24.x. `npm run dev`, `npm run build`, `npm run start`, and `npm run lint` are defined. The repository also contains Node's built-in test suites, runnable with `node --test`.

Required server environment variables are `GEMINI_API_KEY` and `TMDB_API_KEY`. `.env.example` contains blank placeholders. A local `.env.local` exists in this checkout; its contents were not read or copied into this reference.

## Reference documents and stale planning text

- `MediaPulse — Updated V1 Master Roadmap.md`, `MediaPulse — Complete Local Development Handoff.md`, and `MediaPulse — Local Chat Handoff Prompt.md` include historical phase plans. Any instruction in them that says to resume Phase 3 / Task 3.1 or describes Phase 9 as the immediate next task is obsolete; use this current reference and the user's latest direction.
- The visual direction, color, typography, and layout files remain useful as design rationale/specification. Their “Phase 3” status labels describe the original planning sequence rather than current unfinished implementation work.
- `Gemini Interview System Prompt.txt` is operational prompt guidance and must remain synchronized with the runtime copy in `services/gemini/interview-prompt.ts` if either is changed.
- The root README and this reference are maintained separately; both should describe the same current recommendation flow.

## Scope and evidence

This reference describes the implemented TMDB-first discovery flow. Automated test, type, lint, and build results for the current change are recorded in the implementation handoff; live provider performance and hosted demo availability have not been evaluated here.
