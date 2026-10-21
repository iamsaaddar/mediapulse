# MediaPulse — Current Project Reference

**Reference date:** 2026-10-20  
**Project state:** The anchor-vibe interview and discovery-aware recommendation flow is implemented in the repository.  
**Authority:** This file supersedes old “current task,” phase, and next-step instructions in the historical handoff and roadmap documents in this folder.

## Product

MediaPulse is a movie discovery experience that starts from an anchor film, lets a viewer select granular vibes and hard decade/language filters, then uses a short adaptive interview to refine a taste profile and personality. It returns five personalized, TMDB-verified films ranked for both taste fit and discovery. The product principle is: **Gemini proposes. TMDB verifies. MediaPulse decides.**

V1 is movie-only, has no login, database, user accounts, or social features, and keeps Gemini and TMDB credentials on the server. The experience has a cinematic theater visual identity, an adaptive interview, a moviegoer personality card, and interactive DVD case recommendation cards.

## User journey and routes

1. `/` presents the landing page and explains the movie discovery experience.
2. `/quiz` begins with an anchor title; `/api/vibes` returns 10–15 Gemini-generated keywords for user selection, followed by decade and language filters.
3. `/api/interview` asks adaptive questions within selected vibes. The application requires at least two answers and allows at most five. Completion provides a profile, confidence, and personality.
4. `/api/recommendations` receives the profile and preferences, generates candidate batches, enforces TMDB decade/original-language filters, and selects exactly five distinct verified movies using fit and discovery signals.
5. `/api/health` remains a small service health response. The results screen presents the personality and five verified movie cards and supports recommendation retry or retaking the experience.

Interview state and results are held in browser memory; there is no persistence layer.

## Architecture map

- `app/`: App Router pages, global styles, metadata, and API routes.
- `components/landing/`: landing hero, how-it-works section, and CTA.
- `components/interview/`: anchor/vibe/filter setup, theater interview shell, typed question controls, validation feedback, progress, and completion wrapper.
- `components/results/`: personality reveal, movie artwork fallback, and interactive movie cases.
- `components/ui/`: shared buttons, containers, status/error UI, progress, header, and spinner.
- `services/gemini/`: server-only Gemini client, vibe extraction, adaptive interview policy/service, and recommendation candidate generation.
- `services/tmdb/`: TMDB request client, search, details mapping, and conservative candidate verification.
- `services/recommendations/`: candidate batching, de-duplication, TMDB verification, hard filtering, and fit/discovery ranking.
- `schemas/`: Zod runtime contracts; `types/` infers TypeScript types from those contracts.
- `lib/`: environment validation, safe API clients, answer/limit rules, error types, logging, and one-shot recommendation handoff.
- `config/` and `constants/`: model defaults, 2–5 interview bounds, supported decades/languages, taste dimensions, and input/output limits.
- `*.test.mjs`: Node test suites for API routes, schemas, client adapters, prompts, TMDB verification, and recommendation orchestration.

## Request and validation boundaries

- Product POST routes parse JSON, validate requests with Zod, and return a consistent `{ error: { code, message } }` shape for failures.
- Interview responses are discriminated as `continue` or `complete`. The server and client enforce the 2–5 answer bounds; duplicate question IDs are rejected in the browser flow.
- Gemini structured output is projected from Zod JSON Schema into the provider's supported schema shape and then validated again against the full application schema.
- The Gemini client is server-only, uses `GEMINI_API_KEY`, classifies provider failures, redacts key-like details, and retries only transient failures with a bounded retry count.
- Recommendation generation requests 7–8 candidates per batch, verifies them against TMDB, de-duplicates titles and TMDB IDs, and allows up to two batches. Selected decade and original-language filters are enforced on TMDB metadata. Ranking equally weights Gemini fit estimates and a log-normalized inverse-vote-count discovery signal, reserves up to three slots for strong-fit lesser-known movies when available, and requires a 0.55 minimum fit score.
- `TMDB_API_KEY` is read on the server. Movie artwork is sourced from `image.tmdb.org`; the Next image configuration allows that host, while the component currently requests images without Next optimization.
- The interview system prompt source lives in this folder and is copied into `services/gemini/interview-prompt.ts`; that source file explicitly requires them to stay synchronized. Runtime guidance also clarifies that conceptual prompt dimensions must map to the schema's supported enum.

## Stack and commands

The checked-in package manifest specifies Next.js `16.3.5`, React `19.2.8`, TypeScript 5, Tailwind CSS 4, Zod 4, and `@google/genai` 2.24.x. `npm run dev`, `npm run build`, `npm run start`, and `npm run lint` are defined. The repository also contains Node's built-in test suites, runnable with `node --test`.

Required server environment variables are `GEMINI_API_KEY` and `TMDB_API_KEY`. `.env.example` contains blank placeholders. A local `.env.local` exists in this checkout; its contents were not read or copied into this reference.

## Reference documents and stale planning text

- `MediaPulse — Updated V1 Master Roadmap.md`, `MediaPulse — Complete Local Development Handoff.md`, and `MediaPulse — Local Chat Handoff Prompt.md` include historical phase plans. Any instruction in them that says to resume Phase 3 / Task 3.1 or describes Phase 9 as the immediate next task is obsolete; use this current reference and the user's latest direction.
- The visual direction, color, typography, and layout files remain useful as design rationale/specification. Their “Phase 3” status labels describe the original planning sequence rather than current unfinished implementation work.
- `Gemini Interview System Prompt.txt` is operational prompt guidance and must remain synchronized with the runtime copy in `services/gemini/interview-prompt.ts` if either is changed.
- The root README and this reference are different files. The README contains its own release/roadmap wording; this task intentionally updates only `.projectinfo` as requested.

## Scope and evidence

This is a repository orientation record updated with the anchor-vibe flow. Application source and documentation were changed for this feature. Automated tests, builds, lint, deployment checks, and live provider calls were not run in this implementation turn. The hosted demo URL appears in the README; its current availability was not checked.
