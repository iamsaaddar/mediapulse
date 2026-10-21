# MediaPulse process roadmap

This describes the current anchor-to-results flow implemented by the app.

```text
Anchor movie title
  -> POST /api/vibes
  -> Gemini returns 10–15 granular vibe keywords
  -> user selects vibes, decades, and original languages
  -> POST /api/interview for each short adaptive turn
  -> Gemini builds a taste profile in the selected vibe scope
  -> POST /api/recommendations
  -> Gemini proposes 7–8 candidates per batch with fit estimates
  -> TMDB verifies identities and supplies authoritative metadata
  -> server applies decade/language filters and fit/discovery ranking
  -> exactly five distinct verified recommendations
```

## 1. Vibe extraction and preference selection

The browser sends the entered title to `POST /api/vibes`. The server validates it, calls Gemini with the title as the sole extraction input, validates 10–15 distinct structured keywords, and returns them with a category: atmosphere, emotion, micro-genre, trope, pacing, or visual style. The user selects one or more tags.

The setup also offers multi-select decades from the 1940s through the 2020s and supported original languages. Empty decade or language selections mean Any Era or Any Language. The resulting preference state contains the anchor, selected vibe objects, decades, and language codes. It travels in every interview and recommendation request; no database or account is added.

## 2. Adaptive micro-interview

The browser sends `POST /api/interview` with the preference state, current profile, answer count, and latest interaction. On the first turn there is no interaction; Gemini generates the first targeted question. Subsequent turns include the latest question and answer plus Gemini’s updated taste profile.

The prompt treats selected vibe tags as the interview’s scope, treats the anchor only as context, and says not to question or weaken decade and language constraints. Structured responses are validated with Zod. The application requires at least two answered questions before completion and enforces a maximum of five. It asks for completion at the cap, rejects continuation beyond it, and starts recommendations automatically when a valid completion arrives.

Interview state remains in the browser. The API receives compact state on each request and does not persist a transcript.

## 3. Candidate generation and anti-popularity selection

The recommendation request contains the final taste profile, selected preferences, confidence, and personality. Gemini returns 7–8 candidates per batch, each with a title, optional year, personalized reason, and a 0–1 taste-fit estimate. The prompt emphasizes the selected vibe space and actively seeks aesthetic matches beyond mainstream titles.

The orchestrator permits two batches, deduplicates candidate titles, and uses the existing conservative TMDB title/year matching before fetching movie details. It discards any verified movie outside selected decades or original languages. When a filter is active, missing release year or language metadata cannot pass it.

The application ranks eligible candidates using equal weights for Gemini’s taste-fit estimate and a discovery score derived from log-normalized TMDB vote count. Up to three places are reserved for high-fit movies with fewer than 2,500 votes when enough qualify; the remaining places are filled by the combined score. Popularity does not act as a positive relevance score. Candidates below a 0.55 fit estimate are not selected.

Success returns exactly five distinct verified movies, preserving each candidate’s personalized reason and combining it with TMDB metadata. If five strong matches cannot satisfy the selected filters, the API returns an insufficient-results error and the UI suggests broadening filters; constraints are not silently relaxed.

## 4. Main code map

| Responsibility | Entry points |
| --- | --- |
| Anchor, vibe, and filter UI | `app/quiz/page.tsx`, `components/interview/PreferenceSetup.tsx` |
| Vibe API and Gemini extraction | `app/api/vibes/route.ts`, `lib/vibes-api.ts`, `services/gemini/vibes.ts`, `schemas/vibes.ts` |
| Interview API and short-turn policy | `app/api/interview/route.ts`, `services/gemini/interview.ts`, `services/gemini/interview-prompt.ts`, `schemas/interview.ts` |
| Recommendation API and candidate ranking | `app/api/recommendations/route.ts`, `services/gemini/recommendations.ts`, `services/recommendations/orchestrator.ts`, `services/recommendations/ranking.ts` |
| TMDB identity and metadata | `services/tmdb/search.ts`, `services/tmdb/verify.ts`, `services/tmdb/movie.ts` |
| Preference and output contracts | `schemas/preferences.ts`, `schemas/recommendations.ts`, `schemas/movie.ts`, `constants/preferences.ts` |
