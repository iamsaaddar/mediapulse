# MediaPulse — Local Chat Handoff

You are taking over an existing software project called **MediaPulse**.

Your job is to continue development from the current state without redesigning decisions that have already been finalized.

---

# 1. PROJECT IDENTITY

**Project name:** MediaPulse

**Repository:** `mediapulse`

**V1 title:** AI-Powered Movie Personality & Recommendation Engine

**Tagline:**

> Discover what your movie taste says about you.

MediaPulse is an AI-powered movie personality and recommendation application.

The user answers an adaptive interview. Gemini analyzes the user's answers and develops an understanding of their movie taste. Gemini then selects movie recommendations. TMDB verifies those movies and provides authoritative movie metadata and artwork.

---

# 2. CORE V1 SCOPE

The following scope is LOCKED for V1.

## V1 includes

- Movie personality analysis
- Adaptive AI-driven interview
- Personalized movie recommendations
- Gemini AI integration
- TMDB integration
- Responsive web UI
- Results/personality page
- Shareable profile card
- Accessibility basics
- Loading/error states
- Testing
- Deployment
- Professional GitHub documentation

## V1 deliberately does NOT include

- Authentication
- User accounts
- Database
- Persistent user profiles
- Spotify
- Music recommendations
- `/api/auth`
- `/api/login`
- `/api/users`
- `/api/profile`
- `/api/database`
- `/api/tmdb`
- `/api/gemini`
- `/api/movies/search`
- `/api/spotify`
- `/api/music`

Do not introduce infrastructure that V1 does not require.

---

# 3. HARD CONSTRAINT

The project should remain **$0 cost for V1**.

Prefer free/open-source/client-side approaches whenever possible.

Do not introduce paid services unless explicitly discussed and approved.

---

# 4. ENGINEERING APPROACH

This is a public GitHub portfolio project.

The development process matters as much as the final UI.

We are intentionally building it incrementally:

```text
Understand
    ↓
Plan
    ↓
Implement
    ↓
Run
    ↓
Test
    ↓
Fix
    ↓
Commit
    ↓
Document
    ↓
Next task
```

Do NOT build the entire application in one pass.

For every meaningful task:

1. Explain what we are doing.
2. Implement only that task.
3. Run appropriate verification.
4. Fix problems.
5. Confirm the result.
6. Only then move to the next task.
7. Recommend a meaningful Git commit when the task/phase is actually verified.

---

# 5. GITHUB PHILOSOPHY

This is an IT-student portfolio project.

Git history should demonstrate deliberate engineering.

Use meaningful commits such as:

```text
chore: initialize MediaPulse repository
feat: add landing page
feat: implement quiz engine
feat: integrate Gemini
feat: integrate TMDB
feat: add profile card
fix: handle TMDB API errors
docs: update README
```

Do not create meaningless commits such as:

```text
update
changes
stuff
final
test
```

The final project should demonstrate:

- frontend development
- backend/API architecture
- AI integration
- external API integration
- validation
- error handling
- responsive UI
- accessibility
- Git/GitHub workflow
- deployment

---

# 6. ARCHITECTURAL PRINCIPLE

The most important architecture decision is:

## Gemini understands the user.

## TMDB verifies the movies.

The conceptual pipeline is:

```text
                    USER
                      │
                      ▼
               ┌──────────────┐
               │    GEMINI    │
               │              │
               │ Understand   │
               │ user's taste │
               └──────┬───────┘
                      │
                      ▼
               Movie candidates
                      │
                      ▼
               ┌──────────────┐
               │     TMDB     │
               │              │
               │ Verify title │
               │ Get metadata │
               │ Get artwork  │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │  MediaPulse  │
               │    Results   │
               └──────────────┘
```

Gemini is responsible for:

- understanding the user's taste
- asking useful adaptive questions
- maintaining an understanding of taste
- generating the personality interpretation
- selecting movie candidates
- explaining why recommendations fit

TMDB is responsible for:

- verifying movie existence
- canonical movie information
- TMDB IDs
- release dates
- overview
- poster/backdrop paths
- ratings
- vote counts
- genre IDs
- original language
- other authoritative metadata

The application is responsible for:

- validation
- API boundaries
- interview limits
- state management
- orchestration
- accepting/rejecting Gemini candidates
- error handling
- security
- response normalization

---

# 7. AI INTERVIEW DESIGN

The interview is NOT a fixed traditional quiz.

Gemini dynamically chooses the next question based on what it has learned so far.

The application controls the boundaries.

Current intended limits:

```text
MIN_QUESTIONS = 5
MAX_QUESTIONS = 10
```

The logic is:

```text
Below minimum
      ↓
  CONTINUE

At/above minimum
      ↓
Does Gemini have enough information?
      /        \
    NO          YES
    ↓            ↓
CONTINUE      COMPLETE

Maximum reached
      ↓
   COMPLETE
```

Gemini cannot bypass application-enforced limits.

---

# 8. TASTE DIMENSIONS

The controlled taste dimensions are:

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

These dimensions provide structure while allowing Gemini to reason adaptively.

---

# 9. QUESTION TYPES

Allowed question types:

```text
single_choice
multi_choice
free_text
```

Gemini should select the question type that best helps understand the user.

The frontend renders the appropriate UI based on the structured question type.

---

# 10. INTERVIEW STATE

V1 has:

- no database
- no authentication
- no user account

Therefore interview state is temporary and browser-controlled.

Conceptually:

```text
Browser
│
├── questions
├── answers
├── current question
└── taste profile
        │
        ▼
     API Route
        │
        ▼
      Gemini
```

We should not endlessly send the entire conversation to Gemini.

The intended approach is to maintain a compact structured state containing things such as:

```json
{
  "questionCount": 4,
  "tasteProfile": {
    "genres": [],
    "themes": [],
    "tone": [],
    "pacing": [],
    "characters": [],
    "complexity": [],
    "visualStyle": [],
    "endingPreference": [],
    "likes": [],
    "dislikes": []
  },
  "recentAnswers": []
}
```

The exact implementation/schema already established in the project should be respected.

---

# 11. GEMINI INTERVIEW CONTRACT

The Gemini interview response is structured JSON.

It contains the interview status:

```text
continue
complete
```

When continuing, Gemini supplies the next question.

The structured response also contains taste updates such as:

- signals
- likes
- dislikes
- confidence

The application validates Gemini output with Zod.

Do not rely on free-form AI text when structured data is required.

---

# 12. RECOMMENDATION ARCHITECTURE

Recommendation generation is separate from interview generation.

Gemini receives the user's structured taste information and returns exactly **five movie candidates**.

The Gemini recommendation output contains:

- movie title
- optional year
- personalized reason

Gemini does NOT return:

- TMDB IDs
- poster URLs
- backdrop URLs
- TMDB ratings
- official descriptions
- other authoritative TMDB metadata

Gemini recommends.

TMDB verifies.

---

# 13. RECOMMENDATION RULES

Gemini recommendation behavior should:

- optimize for personal fit
- consider confidence
- consider negative preferences
- avoid generic explanations
- return exactly five recommendations
- allow meaningful variety
- avoid overfitting to popularity
- recommend real feature films believed to exist

A false positive movie match is worse than a false negative.

---

# 14. TMDB VERIFICATION

The intended verification flow is:

```text
Gemini candidate
      ↓
Normalize candidate
      ↓
TMDB /search/movie
      ↓
Evaluate candidate match
      ↓
Conservative acceptance
      ↓
TMDB /movie/{id}
      ↓
Validate authoritative metadata
      ↓
Accepted movie
```

Do not blindly trust a title returned by Gemini.

The application should conservatively evaluate title/year matches.

TMDB is the source of truth for verified movie metadata.

---

# 15. API ARCHITECTURE

V1 has exactly three API routes:

```text
POST /api/interview
POST /api/recommendations
GET  /api/health
```

The routes should remain thin.

Conceptually:

```text
Route
  ↓
Validate input
  ↓
Service
  ↓
External API
  ↓
Normalize/validate
  ↓
Response
```

The recommendation endpoint is an orchestration boundary:

```text
/api/recommendations
        │
        ▼
RecommendationOrchestrator
        │
        ├── GeminiRecommendationService
        │
        ├── TMDBVerificationService
        │
        └── ResultComposer
```

This keeps provider-specific implementation details outside the API route.

---

# 16. TARGET PROJECT STRUCTURE

The intended architecture is:

```text
mediapulse/
├── app/
│   ├── api/
│   │   ├── interview/
│   │   │   └── route.ts
│   │   ├── recommendations/
│   │   │   └── route.ts
│   │   └── health/
│   │       └── route.ts
│   ├── quiz/
│   │   └── page.tsx
│   ├── results/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Spinner.tsx
│   │   └── ErrorMessage.tsx
│   │
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   └── LandingCTA.tsx
│   │
│   ├── interview/
│   │   ├── InterviewContainer.tsx
│   │   ├── QuestionRenderer.tsx
│   │   ├── SingleChoiceQuestion.tsx
│   │   ├── MultiChoiceQuestion.tsx
│   │   ├── FreeTextQuestion.tsx
│   │   ├── InterviewProgress.tsx
│   │   └── InterviewLoading.tsx
│   │
│   ├── results/
│   │   ├── PersonalityHeader.tsx
│   │   ├── PersonalityTraits.tsx
│   │   ├── MovieRecommendations.tsx
│   │   ├── MovieCard.tsx
│   │   ├── RecommendationReason.tsx
│   │   └── ResultsActions.tsx
│   │
│   └── profile/
│       ├── ProfileCard.tsx
│       └── ShareButton.tsx
│
├── services/
│   ├── gemini/
│   │   ├── client.ts
│   │   ├── interview.ts
│   │   └── recommendations.ts
│   │
│   ├── tmdb/
│   │   ├── client.ts
│   │   ├── search.ts
│   │   ├── movie.ts
│   │   └── verify.ts
│   │
│   └── recommendations/
│       └── orchestrator.ts
│
├── schemas/
│   ├── interview.ts
│   ├── recommendations.ts
│   ├── movie.ts
│   ├── api.ts
│   └── common.ts
│
├── types/
│   ├── interview.ts
│   ├── taste.ts
│   ├── recommendation.ts
│   ├── movie.ts
│   └── api.ts
│
├── config/
│   ├── interview.ts
│   └── environment.ts
│
├── lib/
│   ├── env.ts
│   ├── errors.ts
│   ├── logger.ts
│   └── utils.ts
│
├── constants/
│   ├── taste-dimensions.ts
│   ├── question-types.ts
│   └── limits.ts
│
├── public/
│
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

Do not create every file just because it appears in the target architecture.

Implement files when their phase/task requires them.

---

# 17. TECHNOLOGY STACK

The intended stack is:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Motion/Framer Motion
- Google Gemini via `@google/genai`
- TMDB API
- Vercel for deployment
- GitHub for source control

Gemini must remain server-side.

API keys must never be exposed to the browser.

---

# 18. ENVIRONMENT VARIABLES

The project uses an environment template.

Expected secrets include:

```text
GEMINI_API_KEY=
TMDB_API_KEY=
```

Real credentials belong only in `.env.local`.

Never commit:

```text
.env
.env.local
```

or any file containing real API keys.

`.env.example` should contain placeholders only.

---

# 19. PHASE ROADMAP

The complete V1 roadmap is:

```text
PHASE 0  — Project & GitHub Setup
        ↓
PHASE 1  — Technical Architecture
        ↓
PHASE 2  — Application Foundation
        ↓
PHASE 3  — Design System & UI Foundation
        ↓
PHASE 4  — Landing Page
        ↓
PHASE 5  — Quiz Engine
        ↓
PHASE 6  — Gemini AI Personality Engine
        ↓
PHASE 7  — TMDB Recommendation Engine
        ↓
PHASE 8  — Results / Movie Personality Page
        ↓
PHASE 9  — Shareable Profile Card
        ↓
PHASE 10 — Error Handling / Accessibility / Polish
        ↓
PHASE 11 — Testing & Quality Assurance
        ↓
PHASE 12 — Deployment & GitHub Portfolio
        ↓
V1 COMPLETE
```

Milestones:

```text
M0  GitHub repository
M1  Next.js foundation
M2  Design system
M3  Landing page
M4  Complete quiz
M5  Gemini personality
M6  TMDB recommendations
M7  Complete results page
M8  Shareable profile
M9  Production polish
M10 QA
M11 Deployment
M12 Portfolio-ready V1
```

---

# 20. PHASE 0 STATUS — COMPLETE

Phase 0 established:

- project identity
- GitHub repository
- public portfolio direction
- README foundation
- Git workflow
- `.gitignore`
- `.env.example`
- environment-secret policy

The repository is named:

```text
mediapulse
```

The project is intended to be public because it is a portfolio project.

---

# 21. PHASE 1 STATUS — COMPLETE

Phase 1 established the architecture.

Important decisions completed:

- AI-driven adaptive interview
- controlled taste dimensions
- AI vs application responsibilities
- structured Gemini responses
- question boundaries
- browser-based V1 state
- Gemini → TMDB responsibility boundary
- interview JSON contract
- Gemini interview system prompt
- interview state schema
- recommendation output schema
- TMDB verification contract
- API routes
- error/fallback architecture
- final folder architecture

Do not redesign these decisions without a concrete reason.

---

# 22. PHASE 2 STATUS — COMPLETE AND VERIFIED

Phase 2 established the application foundation.

The Gemini SDK was installed successfully:

```bash
npm install @google/genai
```

Installation succeeded.

There was a warning:

```text
npm warn deprecated node-domexception@1.0.0:
Use your platform's native DOMException instead
```

This was a dependency warning, not an installation failure.

The project was subsequently verified with:

```bash
git status --short
```

and the working tree was clean.

The production build was also verified successfully with:

```bash
npm run build
```

The project uses:

```text
Next.js 16.3.5
Turbopack
```

The build completed successfully.

Phase 2 should therefore be treated as complete unless inspection of the actual repository shows otherwise.

Before making assumptions, inspect the local repository.

---

# 23. CURRENT POSITION

We are now beginning:

# PHASE 3 — DESIGN SYSTEM & UI FOUNDATION

Phase 3 must be completed before building the actual landing page.

The current task is:

# TASK 3.1 — DEFINE THE EXACT MEDIAPULSE VISUAL DESIGN SYSTEM

This is where you should resume.

Do NOT jump directly to:

- landing page
- quiz UI
- Gemini implementation
- TMDB implementation
- results page

First establish the design system.

---

# 24. PHASE 3 TASKS

The planned Phase 3 sequence is:

```text
Task 3.1 — Lock visual direction
Task 3.2 — Typography system
Task 3.3 — Color/design tokens
Task 3.4 — Layout system
Task 3.5 — UI primitives
Task 3.6 — Motion system
Task 3.7 — Responsive/accessibility foundation
Task 3.8 — Phase 3 verification
```

The current task is **3.1**.

---

# 25. TASK 3.1 EXPECTATION

For Task 3.1, first inspect the existing repository.

Then define and lock:

- overall visual direction
- visual personality
- typography direction
- color philosophy
- spacing philosophy
- border-radius philosophy
- card philosophy
- button philosophy
- background treatment
- visual hierarchy
- component design principles

The design should feel appropriate for a modern AI-powered movie discovery/product experience.

However, do not blindly invent a design system disconnected from the existing MediaPulse concept or requirements.

Make the visual direction deliberate and reusable.

---

# 26. IMPORTANT PHASE 3 RULE

Do not start implementing the landing page during Task 3.1.

Task 3.1 is about establishing the visual language.

Later tasks will convert that visual language into:

- design tokens
- reusable UI primitives
- motion
- responsive behavior
- accessibility foundation

Only after Phase 3 is verified should Phase 4 begin.

---

# 27. WORKING STYLE FOR THIS HANDOFF

When you take over:

## Step 1

Inspect the actual local repository.

Check:

```bash
git status
git branch
git log --oneline -10
```

Inspect:

```text
package.json
app/
components/
services/
schemas/
types/
config/
lib/
constants/
globals.css
tailwind configuration if present
```

Do not assume the target architecture is already fully implemented.

---

## Step 2

Compare the actual repository against the established architecture above.

If something differs, determine whether it is:

- an intentional implementation difference
- an unfinished task
- an accidental deviation

Do not overwrite working code unnecessarily.

---

## Step 3

Work specifically on Task 3.1.

Do not silently advance into Tasks 3.2–3.8.

---

## Step 4

Verify the changes.

At minimum, use the project's appropriate checks.

The project has previously used:

```bash
npm run build
```

and should continue maintaining a clean build.

---

## Step 5

Report:

```text
Task completed
Files changed
Design decisions
Verification performed
Verification results
Anything that needs attention
Recommended Git commit
```

Do not claim something was verified unless you actually ran the verification.

---

# 28. GIT RULE

Do not commit automatically unless explicitly requested or unless the project's established workflow specifically requires it.

First show the work and verification.

Then recommend the commit message.

For a verified Task 3.1 implementation, a reasonable commit could eventually be:

```text
feat: define MediaPulse visual design system
```

But only use it after confirming the actual changes.

---

# 29. DO NOT LOSE THESE ARCHITECTURAL PRINCIPLES

These are especially important:

### Principle 1

Gemini understands the user.

### Principle 2

TMDB verifies movies.

### Principle 3

The application controls AI boundaries.

### Principle 4

API keys remain server-side.

### Principle 5

V1 has no database.

### Principle 6

V1 has no authentication.

### Principle 7

The interview is adaptive rather than a fixed quiz.

### Principle 8

Structured AI output is validated.

### Principle 9

False-positive movie verification is worse than false-negative verification.

### Principle 10

Build incrementally and verify every layer.

---

# 30. FINAL INSTRUCTION

You are now taking over the **existing local MediaPulse repository**.

Do not restart the project.

Do not redesign the architecture.

Do not replace Gemini/TMDB decisions.

Do not jump ahead to later phases.

First inspect the repository and then continue from:

# PHASE 3 → TASK 3.1

**Define and lock the exact MediaPulse visual design system.**

Begin by inspecting the actual project files and Git state.