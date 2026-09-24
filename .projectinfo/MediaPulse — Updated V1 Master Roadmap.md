# MediaPulse — Updated V1 Master Roadmap

## Current Project Direction

**MediaPulse** is an AI-powered movie personality and recommendation engine.

The core principle is:

> **Gemini understands the user's movie taste. TMDB verifies the movies. MediaPulse controls the application logic.**

V1 remains:

- Movie-only
- No authentication
- No database
- No user accounts
- No social features
- $0-cost target
- Server-side API keys
- Adaptive AI interview
- Structured and validated AI responses
- TMDB verification before movies reach the user

---

# CURRENT STATUS

| Phase | Status |
|---|---|
| Phase 0 — Project & GitHub Setup | ✅ Complete |
| Phase 1 — Technical Architecture | ✅ Complete |
| Phase 2 — Application Foundation | ✅ Complete + Verified |
| Phase 3 — Design System & UI Foundation | ✅ Complete + Verified |
| Phase 4 — Landing Page | ⏳ Not started |
| Phase 5 — Adaptive Interview UI | ⏳ Not started |
| Phase 6 — Gemini Interview Engine | ⏳ Not started |
| Phase 7 — Recommendation & TMDB Engine | ⏳ Not started |
| Phase 8 — Results Experience | ⏳ Not started |
| Phase 9 — Shareable Profile Card | ⏳ Not started |
| Phase 10 — Production Polish | ⏳ Not started |
| Phase 11 — Testing & QA | ⏳ Not started |
| Phase 12 — Deployment & Portfolio | ⏳ Not started |

### Current position

**PHASE 4 → TASK 4.1 — Build the landing-page hero**

---

# PHASE 0 — PROJECT & GITHUB FOUNDATION

## Goal

Establish the professional repository and development environment.

### Task 0.1 — Project identity

- MediaPulse
- Repository: `mediapulse`
- Movie-only V1
- Portfolio-oriented project

### Task 0.2 — GitHub repository

- Public repository
- Correct project description
- Initial repository setup

### Task 0.3 — README foundation

Create the initial README.

### Task 0.4 — Git workflow

Use meaningful commits:

```text
chore: initialize MediaPulse repository
feat: implement adaptive interview
feat: integrate Gemini
feat: integrate TMDB
feat: build results experience
fix: handle TMDB verification failure
docs: update README
```

### Task 0.5 — `.gitignore`

Protect:

```text
.env
.env.local
node_modules
.next
```

### Task 0.6 — `.env.example`

Current variables:

```text
GEMINI_API_KEY=
TMDB_API_KEY=
```

### Task 0.7 — Repository checkpoint

Verify:

```bash
git status
```

### Phase 0 status

**COMPLETE**

---

# PHASE 1 — TECHNICAL ARCHITECTURE

## Goal

Define how MediaPulse actually works before building the product.

The architecture was substantially refined during this phase.

---

## Task 1.1 — Define AI/application boundary

### Gemini

Gemini is responsible for understanding the user.

It handles:

- adaptive interview questions
- interpreting answers
- updating taste state
- confidence
- deciding when enough information has been collected
- personality generation
- movie candidate selection
- personalized recommendation reasoning

### Application

MediaPulse controls:

- question limits
- validation
- state management
- request boundaries
- response validation
- error handling
- orchestration
- security

### TMDB

TMDB is authoritative for movie information.

It handles:

- movie existence
- TMDB ID
- canonical title
- release date
- overview
- poster
- backdrop
- rating
- vote count
- genres
- language

---

# Task 1.2 — Adaptive Interview Architecture

The interview is **not a fixed six-question quiz**.

The system uses:

```text
MIN_QUESTIONS = 5
MAX_QUESTIONS = 10
```

Logic:

```text
Below minimum
      ↓
CONTINUE

At/above minimum
      ↓
Does Gemini have enough information?
      ↓
YES → COMPLETE
NO  → CONTINUE

Maximum reached
      ↓
COMPLETE
```

Gemini decides what should be asked next.

The application enforces the boundaries.

---

# Task 1.3 — Taste Dimensions

The controlled taste model includes dimensions such as:

```text
story
emotion
characters
genre
tone
pacing
complexity
themes
visual_style
ending
preferences
```

The system can also maintain:

```text
likes
dislikes
confidence
signals
```

---

# Task 1.4 — Browser State

V1 intentionally has no database.

Temporary interview state lives in the browser.

Conceptually:

```text
Browser
├── questions
├── answers
├── current question
└── taste profile
        ↓
     API Route
        ↓
      Gemini
```

---

# Task 1.5 — Structured AI Contracts

All important Gemini responses are structured.

They are validated with Zod before entering application state.

---

# Task 1.6 — Recommendation Architecture

The recommendation pipeline is:

```text
Completed Taste Profile
        ↓
Gemini
        ↓
5 Movie Candidates
        ↓
TMDB Search
        ↓
Conservative Verification
        ↓
TMDB Movie Details
        ↓
Verified Movies
        ↓
Final Results
```

The important rule:

> **Gemini recommends. TMDB verifies.**

---

# Task 1.7 — API Architecture

V1 has exactly three public API routes:

```text
POST /api/interview
POST /api/recommendations
GET  /api/health
```

Architecture:

```text
API Route
   ↓
Validation
   ↓
Service / Orchestrator
   ↓
External API
   ↓
Normalize
   ↓
Validate
   ↓
Response
```

The recommendation route acts as an orchestration boundary:

```text
/api/recommendations
        ↓
RecommendationOrchestrator
        ├── GeminiRecommendationService
        ├── TMDBVerificationService
        └── ResultComposer
```

---

# Task 1.8 — Error Architecture

Define:

- validation errors
- Gemini failures
- malformed AI responses
- TMDB failures
- movie verification failures
- no verified recommendations
- network failures
- unexpected server failures

---

# Task 1.9 — Folder Architecture

Lock the implementation structure around:

```text
app/
components/
services/
schemas/
types/
config/
lib/
constants/
public/
```

with clear separation between:

```text
UI
↓
API
↓
Services
↓
External providers
↓
Validated application data
```

### Phase 1 status

**COMPLETE**

---

# PHASE 2 — APPLICATION FOUNDATION

## Goal

Create and verify the actual Next.js foundation.

### Task 2.1 — Next.js foundation

Use:

- Next.js
- React
- TypeScript
- Tailwind CSS

### Task 2.2 — Dependency management

Install only dependencies that have a clear purpose.

Current important dependency:

```text
@google/genai
```

### Task 2.3 — Environment configuration

Maintain:

```text
.env.local
.env.example
```

with secrets only in `.env.local`.

### Task 2.4 — Application structure

Establish the actual project directories and configuration.

### Task 2.5 — Production build

Verify:

```bash
npm run build
```

### Task 2.6 — Git verification

Verify:

```bash
git status --short
```

### Phase 2 status

**COMPLETE + VERIFIED**

The current project has successfully passed the production build checkpoint.

---

# PHASE 3 — DESIGN SYSTEM & UI FOUNDATION

## Goal

Create the visual language before building product screens.

### Task 3.1 — Visual direction

Lock MediaPulse as:

- cinematic
- modern
- atmospheric
- premium
- minimal
- slightly mysterious

The design should feel like a modern movie/AI product rather than a generic SaaS dashboard.

### Task 3.2 — Typography

Define:

- display typography
- body typography
- heading hierarchy
- readable text sizes
- typography spacing

### Task 3.3 — Color system

Define semantic tokens:

```text
background
foreground
muted
accent
card
border
success
error
```

### Task 3.4 — Layout system

Define:

- page width
- content containers
- spacing scale
- section spacing
- grid behavior
- mobile layout
- desktop layout

### Task 3.5 — UI primitives

Create reusable primitives such as:

```text
Button
Card
Badge
ProgressBar
Spinner
ErrorMessage
Container
```

### Task 3.6 — Component principles

Components should be:

- reusable
- composable
- accessible
- responsive
- visually consistent

### Task 3.7 — Motion system

Define motion for:

- page transitions
- question transitions
- selection feedback
- loading states
- result reveal

Motion should communicate state rather than exist purely for decoration.

### Task 3.8 — Responsive/accessibility foundation

Define standards for:

- keyboard navigation
- focus states
- contrast
- touch targets
- reduced motion
- semantic HTML

### Task 3.9 — Phase 3 verification

Run:

```bash
npm run lint
npm run build
```

### Phase 3 status

**COMPLETE + VERIFIED** — visual direction, typography, semantic colors, responsive
layout foundations, reusable UI primitives, component principles, motion, and
responsive/accessibility baselines are implemented. Lint and production build
both pass as the Phase 3 closeout checkpoint.

### CURRENT TASK

**Phase 4 — Task 4.1: Build the landing-page hero**

---

# PHASE 4 — LANDING PAGE

## Goal

Build the first complete user-facing experience.

### Task 4.1 — Hero

Core message:

> Discover what your movie taste says about you.

Primary CTA:

```text
Discover Your Movie Vibe
```

### Task 4.2 — Cinematic visual atmosphere

Build the visual identity using:

- CSS
- gradients
- shapes
- lightweight assets
- motion

while maintaining the $0 requirement.

### Task 4.3 — How it works

Explain:

```text
01 — Answer a few questions

02 — Discover your movie personality

03 — Get movies matched to your taste
```

The copy should make clear that the interview is adaptive rather than presenting it as a rigid six-question quiz.

### Task 4.4 — CTA navigation

Navigate to:

```text
/quiz
```

### Task 4.5 — Responsive implementation

Verify:

- desktop
- tablet
- mobile

### Task 4.6 — Accessibility

Verify:

- semantic buttons
- keyboard navigation
- focus states
- contrast
- screen-reader-friendly structure

### Phase checkpoint

Landing page is complete and independently usable.

---

# PHASE 5 — ADAPTIVE INTERVIEW UI

## Goal

Build the complete interview experience **before connecting Gemini**.

This is different from the old roadmap.

We are NOT building six hard-coded questions.

---

## Task 5.1 — Interview state model

Implement state around:

```text
questionCount
questions
answers
currentQuestion
tasteProfile
recentInteraction
status
```

### Task 5.2 — Question model

Support:

```text
single_choice
multi_choice
free_text
```

### Task 5.3 — Dynamic question renderer

Architecture:

```text
InterviewContainer
        ↓
QuestionRenderer
        ↓
Question Type
   ├── SingleChoice
   ├── MultiChoice
   └── FreeText
```

### Task 5.4 — One-question-at-a-time experience

Display one question at a time.

### Task 5.5 — Progress indicator

Because the interview is adaptive, progress should communicate the current stage without falsely claiming a fixed total such as:

```text
Question 3 of 6
```

Instead, use an adaptive-progress representation.

### Task 5.6 — Answer selection

Support:

- selection feedback
- multiple selections where appropriate
- text input
- validation

### Task 5.7 — Navigation

Implement:

```text
Previous
Next
```

where appropriate.

### Task 5.8 — Interview limits

Application enforces:

```text
minimum = 5
maximum = 10
```

### Task 5.9 — Completion state

When the interview completes:

```text
Taste Profile Ready
        ↓
Generate Recommendations
```

### Task 5.10 — AI analysis/loading experience

Create the cinematic analysis state:

```text
Analyzing your movie taste...

Understanding your preferences
Mapping your cinematic personality
Finding your movie patterns
Preparing your recommendations
```

### Phase checkpoint

The entire adaptive interview UI works using mocked/local responses.

**No Gemini dependency required yet.**

---

# PHASE 6 — GEMINI ADAPTIVE INTERVIEW ENGINE

## Goal

Connect the adaptive interview UI to Gemini.

### Task 6.1 — Gemini environment verification

Verify:

- API access
- selected model
- current free availability
- limits
- SDK behavior

The $0 constraint remains mandatory.

### Task 6.2 — Gemini client

Create the server-side Gemini client using:

```text
@google/genai
```

### Task 6.3 — Interview service

Create:

```text
GeminiInterviewService
```

Responsibilities:

- send compact interview state
- request next question
- interpret taste
- return structured output

### Task 6.4 — Interview API route

Implement:

```text
POST /api/interview
```

Flow:

```text
Client
 ↓
Request validation
 ↓
Interview state validation
 ↓
GeminiInterviewService
 ↓
Gemini
 ↓
Zod validation
 ↓
Application rule enforcement
 ↓
Response
```

### Task 6.5 — Gemini interview system prompt

The prompt must instruct Gemini to:

- behave as a movie taste interviewer
- ask useful adaptive questions
- avoid redundant questions
- consider previous taste signals
- respect available dimensions
- stop when enough information exists
- never exceed application limits
- return structured JSON

### Task 6.6 — Zod validation

Validate:

```text
status
question
question type
options
taste update
signals
likes
dislikes
confidence
```

### Task 6.7 — Invalid AI response handling

If Gemini returns invalid output:

```text
Gemini
 ↓
Invalid JSON/schema
 ↓
Server rejects
 ↓
Controlled error
```

### Task 6.8 — Interview testing

Test:

- short answers
- long answers
- contradictory answers
- repeated preferences
- minimum question boundary
- maximum question boundary
- early completion
- malformed Gemini responses

### Phase checkpoint

A real user can complete an adaptive Gemini-powered movie taste interview.

---

# PHASE 7 — GEMINI RECOMMENDATION + TMDB VERIFICATION ENGINE

## Goal

Turn the completed taste profile into five verified movies.

This phase combines the two provider responsibilities correctly.

---

## Task 7.1 — Recommendation request contract

The request contains the completed structured taste state.

### Task 7.2 — Gemini recommendation service

Gemini generates exactly:

```text
5 movie candidates
```

Each candidate contains:

```text
title
optional year
personalized reason
```

Gemini does NOT provide authoritative:

```text
TMDB ID
poster
rating
overview
genre metadata
```

### Task 7.3 — Recommendation system prompt

Gemini should:

- optimize for personal fit
- respect dislikes
- use confidence
- provide meaningful variety
- avoid generic recommendations
- avoid popularity-only recommendations
- recommend real feature films
- return exactly five candidates

### Task 7.4 — Candidate normalization

Normalize:

```text
title
year
reason
```

before verification.

### Task 7.5 — TMDB search

For every candidate:

```text
Gemini candidate
 ↓
TMDB /search/movie
```

### Task 7.6 — Conservative candidate matching

Do not blindly accept the first search result.

Evaluate:

- title similarity
- year where available
- original title
- release date
- candidate ambiguity

### Task 7.7 — TMDB movie details

After selecting a candidate:

```text
TMDB /movie/{id}
```

Retrieve authoritative metadata.

### Task 7.8 — TMDB verification schema

Validate:

```text
id
title
originalTitle
releaseDate
overview
posterPath
backdropPath
rating
voteCount
genreIds
originalLanguage
```

### Task 7.9 — False-positive protection

Important rule:

> A false-positive movie match is worse than a false-negative match.

If uncertain:

```text
Reject candidate
```

rather than showing the wrong movie.

### Task 7.10 — Continue candidate replacement

If one Gemini candidate fails verification:

```text
Candidate rejected
      ↓
Try another candidate
```

until enough verified movies exist or the system reaches its defined fallback behavior.

### Task 7.11 — Recommendation orchestrator

Implement:

```text
RecommendationOrchestrator
    ├── GeminiRecommendationService
    ├── TMDBVerificationService
    └── ResultComposer
```

### Task 7.12 — Final five

Return exactly:

```text
5 verified movies
```

when successful.

### Task 7.13 — API route

Implement:

```text
POST /api/recommendations
```

### Task 7.14 — Recommendation error handling

Handle:

- Gemini failure
- invalid Gemini response
- TMDB failure
- candidate mismatch
- missing metadata
- insufficient verified movies
- rate limits
- network failure

### Phase checkpoint

Given a completed taste profile, MediaPulse can produce a set of verified personalized movie recommendations.

---

# PHASE 8 — RESULTS / MOVIE PERSONALITY EXPERIENCE

## Goal

Turn the AI/taste data and verified movies into the main MediaPulse result experience.

### Task 8.1 — Results state

Combine:

```text
Movie Personality
+
Taste Signals
+
Verified Movies
```

### Task 8.2 — Personality hero

Make the generated movie personality the centerpiece.

### Task 8.3 — Personality description

Display the AI-generated explanation of the user's taste.

### Task 8.4 — Personality attributes

Display relevant traits such as:

```text
Tone
Pacing
Genres
Themes
Keywords
```

### Task 8.5 — Movie recommendation section

Display five verified movies.

### Task 8.6 — Movie card

Each card can contain:

```text
poster
title
year
rating
genres
overview
personalized reason
```

### Task 8.7 — TMDB attribution/linking

Where required, properly acknowledge/link TMDB information.

### Task 8.8 — Retake experience

Provide:

```text
Take the Quiz Again
```

and reset temporary interview state.

### Task 8.9 — Results responsive design

Optimize:

- desktop
- tablet
- mobile

### Phase checkpoint

A complete user journey exists:

```text
Landing
 ↓
Adaptive Interview
 ↓
AI Analysis
 ↓
Movie Personality
 ↓
5 Verified Movies
```

---

# PHASE 9 — SHAREABLE MOVIE PROFILE

## Goal

Create a standalone shareable representation of the user's movie identity.

### Task 9.1 — Profile card design

Create:

```text
ProfileCard
```

as an independent component.

### Task 9.2 — Card content

Include:

```text
MEDIAPULSE

Movie Personality

Personality title

Short description

Key traits

Movie recommendations
```

### Task 9.3 — Client-side image generation

Use a free/open-source/client-side solution.

No paid image-generation service.

### Task 9.4 — Download

Generate:

```text
mediapulse-profile.png
```

### Task 9.5 — Native sharing

Where supported:

```text
Share
```

Fallback:

```text
Download
```

### Task 9.6 — Image testing

Verify:

- long titles
- long descriptions
- missing posters
- mobile
- desktop
- image quality
- clipping
- overflow

### Phase checkpoint

Users can generate and share/download their MediaPulse profile.

---

# PHASE 10 — PRODUCTION POLISH

## Goal

Turn a working application into a polished product.

### Task 10.1 — Loading states

Every asynchronous operation gets appropriate feedback.

### Task 10.2 — Error states

Handle:

```text
Interview unavailable
Gemini unavailable
TMDB unavailable
Recommendation failure
Invalid state
Network failure
```

### Task 10.3 — Empty/fallback states

No unexplained blank screens.

### Task 10.4 — Accessibility audit

Verify:

- keyboard navigation
- focus management
- semantic HTML
- labels
- alt text
- contrast
- reduced motion
- touch targets

### Task 10.5 — Mobile polish

Special attention to:

```text
interview controls
buttons
text input
movie cards
results
profile card
```

### Task 10.6 — Performance

Review:

- unnecessary renders
- image loading
- bundle size
- animation performance
- API calls

### Task 10.7 — API/security review

Verify:

- secrets remain server-side
- no secrets in Git
- request validation
- response validation
- sensible request boundaries

### Phase checkpoint

The application feels production-ready rather than merely functional.

---

# PHASE 11 — TESTING & QA

## Goal

Systematically verify the entire application.

### Task 11.1 — Unit/schema testing

Test:

- request schemas
- response schemas
- taste state
- recommendation candidates
- TMDB movie data
- validation rules

### Task 11.2 — Interview testing

Test:

- minimum questions
- maximum questions
- early completion
- previous answers
- contradictory answers
- free-text responses
- malformed AI output

### Task 11.3 — AI testing

Test different taste profiles.

Examples:

```text
Psychological + Dark + Slow
```

and:

```text
Feel-good + Comedy + Fast
```

Verify that the resulting taste interpretation and recommendations meaningfully differ.

### Task 11.4 — Recommendation testing

Verify:

- exactly five results
- no duplicate movies
- candidate verification
- wrong-title rejection
- year mismatch handling
- missing metadata
- missing poster
- TMDB failure

### Task 11.5 — End-to-end flow

Test:

```text
Landing
 ↓
Interview
 ↓
Gemini
 ↓
Taste Profile
 ↓
Recommendations
 ↓
TMDB
 ↓
Results
 ↓
Profile Card
```

### Task 11.6 — Responsive testing

Test:

```text
mobile
tablet
desktop
```

### Task 11.7 — Browser testing

Test available major browsers.

### Task 11.8 — Build/lint

Run:

```bash
npm run lint
npm run build
```

### Task 11.9 — Security review

Search for:

```text
API_KEY
SECRET
TOKEN
PASSWORD
```

Verify no sensitive information is committed.

### Task 11.10 — Final regression test

Run the complete product from a clean state.

### Phase checkpoint

No known blocking issues remain.

---

# PHASE 12 — DEPLOYMENT & GITHUB PORTFOLIO

## Goal

Turn the finished project into a professional portfolio project.

### Task 12.1 — Production deployment

Deploy using the selected free deployment platform.

Target:

```text
GitHub
   ↓
Deployment
   ↓
MediaPulse
```

### Task 12.2 — Production environment variables

Configure:

```text
GEMINI_API_KEY
TMDB_API_KEY
```

only through the deployment platform.

### Task 12.3 — Production testing

Test the actual deployed URL.

Not only localhost.

### Task 12.4 — Final README

Document:

```text
Overview
Features
Demo
Screenshots
Tech Stack
Architecture
AI Interview
AI Recommendation System
TMDB Verification
Getting Started
Environment Variables
Project Structure
Testing
Deployment
Future Roadmap
License
```

### Task 12.5 — Screenshots

Capture:

1. Landing page
2. Adaptive interview
3. AI analysis state
4. Movie personality
5. Recommendations
6. Shareable profile card

### Task 12.6 — Architecture documentation

Document the important engineering decisions:

```text
Why Gemini?
Why TMDB?
Why adaptive interview?
Why no database?
Why browser state?
Why structured AI output?
Why TMDB verification?
Why conservative movie matching?
```

### Task 12.7 — GitHub cleanup

Verify:

```text
✓ README
✓ screenshots
✓ clean commits
✓ no secrets
✓ meaningful repository description
✓ correct project structure
✓ license
✓ demo link
```

### Task 12.8 — GitHub topics

Potential topics:

```text
nextjs
typescript
react
tailwindcss
gemini
tmdb
ai
recommendation-system
movie-recommendation
```

### Task 12.9 — Release

Create:

```text
v1.0.0
```

with meaningful release notes.

---

# UPDATED DEVELOPMENT MILESTONES

| Milestone | Completion Criteria |
|---|---|
| **M0** | GitHub + project foundation |
| **M1** | Architecture locked |
| **M2** | Next.js foundation verified |
| **M3** | Design system complete |
| **M4** | Landing page complete |
| **M5** | Adaptive interview UI complete |
| **M6** | Gemini interview working |
| **M7** | Gemini + TMDB recommendation pipeline working |
| **M8** | Complete results experience |
| **M9** | Shareable profile card |
| **M10** | Production polish |
| **M11** | QA complete |
| **M12** | Deployed portfolio-ready V1 |

---

# UPDATED PRODUCT FLOW

The final MediaPulse V1 flow is:

```text
                    LANDING
                       │
                       ▼
              DISCOVER YOUR VIBE
                       │
                       ▼
              ADAPTIVE INTERVIEW
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 │
        Gemini asks             │
        next question           │
              │                 │
              └───────┐         │
                      │         │
                Enough data?    │
                  │       │     │
                 NO      YES    │
                  │       │     │
                  └───┐   │     │
                      ▼   ▼     │
                  COMPLETE       │
                      │          │
                      ▼          │
               TASTE PROFILE     │
                      │          │
                      ▼          │
                   GEMINI        │
                      │          │
                5 candidates     │
                      │          │
                      ▼          │
                    TMDB         │
                      │          │
                verification     │
                      │          │
                      ▼          │
              VERIFIED MOVIES    │
                      │          │
                      ▼          │
                RESULT PAGE      │
                      │          │
             ┌────────┴────────┐ │
             ▼                 ▼ │
       Movie Personality    Movie Picks
             │                 │
             └────────┬────────┘
                      ▼
                PROFILE CARD
                      │
                ┌─────┴─────┐
                ▼           ▼
             SHARE       DOWNLOAD
```

---

# UPDATED ARCHITECTURE

```text
                         USER
                          │
                          ▼
                      NEXT.JS
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
       Interview UI             Results UI
              │
              ▼
      POST /api/interview
              │
              ▼
     Gemini Interview Service
              │
              ▼
            GEMINI
              │
              ▼
     Structured Interview State
              │
              ▼
       Completed Taste Profile
              │
              ▼
   POST /api/recommendations
              │
              ▼
    Recommendation Orchestrator
          │              │
          ▼              ▼
       GEMINI           TMDB
          │              │
          │         Search + Details
          │              │
          └───────┬──────┘
                  ▼
          Verified Movies
                  │
                  ▼
            Result Composer
                  │
                  ▼
              Results UI
                  │
                  ▼
             Profile Card
```

---

# NON-NEGOTIABLE ARCHITECTURE RULES

These remain locked for V1:

1. **Gemini understands the user.**
2. **TMDB verifies movies.**
3. **The application controls AI boundaries.**
4. **API keys stay server-side.**
5. **No database.**
6. **No authentication.**
7. **Interview is adaptive.**
8. **Interview has a 5–10 question boundary.**
9. **AI output is structured and validated.**
10. **Movie candidates are verified through TMDB.**
11. **False-positive movie verification is worse than false-negative.**
12. **Exactly five verified recommendations are targeted.**
13. **V1 remains $0-cost.**
14. **No unnecessary API routes.**
15. **Every layer is verified before moving forward.**

---

# DEVELOPMENT WORKFLOW

Every task follows:

```text
1. Understand
      ↓
2. Plan
      ↓
3. Implement
      ↓
4. Run
      ↓
5. Test
      ↓
6. Fix
      ↓
7. Verify
      ↓
8. Commit
      ↓
9. Document
      ↓
10. Move forward
```

We do **not** build the entire application and hope it works.

---

# GITHUB / PORTFOLIO CHECKPOINTS

Throughout development, we will explicitly identify:

### GitHub checkpoint

When to commit.

### Engineering decision

What architectural decision was made and why.

### Portfolio value

What skill the implementation demonstrates.

### README material

What should eventually be documented.

### Resume value

What can legitimately be described as an engineering accomplishment.

---

# IMMEDIATE NEXT STEPS

Phase 3 is **complete and verified**. The next roadmap task is:

## **PHASE 4 — TASK 4.1**
### Build the landing-page hero.

Phase 4 begins the user-facing product experience. Do not treat the remaining
Phase 4 tasks as complete until their screens and behavior are implemented.
