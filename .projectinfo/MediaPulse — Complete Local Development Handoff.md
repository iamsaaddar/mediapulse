# MEDIAPULSE — COMPLETE LOCAL DEVELOPMENT HANDOFF

## IMPORTANT: THIS IS AN EXISTING PROJECT

You are taking over an existing local software project called **MediaPulse**.

The repository already exists and development has already progressed through **Phase 0, Phase 1, and Phase 2**.

**DO NOT restart the project.**

**DO NOT redesign the project from scratch.**

**DO NOT replace the existing architecture simply because you would personally structure it differently.**

First inspect the actual local repository and Git history.

The current development position is:

# PHASE 3 → TASK 3.1

Your first responsibility is to continue the existing project from that exact point.

---

# 1. SOURCE OF TRUTH HIERARCHY

There are several project documents.

Understand their roles correctly.

### Product specification

The uploaded:

`Final Requirments.txt`

is the **MediaPulse Final V1 Requirements** document.

It defines the product, user experience, V1 scope, feature requirements, technology direction, cost constraints, security requirements, accessibility requirements, and overall product flow.

The core product definition is:

> MediaPulse is an AI-powered movie personality and recommendation engine.

The V1 product creates a personalized Movie Personality from the user's movie preferences and ultimately provides personalized movie recommendations and a shareable Movie Profile Card.

### Architecture specification

The later Phase 1 architecture work refined HOW the product is implemented.

That architecture is more specific than the original product requirements.

When there is a difference:

- Product requirements define **what MediaPulse must do**.
- Locked architecture decisions define **how we chose to implement it**.

Do not silently revert later architectural decisions back to earlier conceptual descriptions.

---

# 2. WHAT MEDIAPULSE ACTUALLY IS

MediaPulse is a polished web application that analyzes someone's movie taste.

The intended experience is:

```text
Landing Page
      ↓
Discover Your Movie Vibe
      ↓
Movie Taste Interview
      ↓
Analyzing Your Taste
      ↓
AI Movie Personality
      ↓
Personalized Movie Recommendations
      ↓
Movie Profile / Taste Card
      ↓
Share / Download
```

This overall product journey comes directly from the V1 requirements.

The application should feel like a real polished consumer product, not a technical AI demo.

---

# 3. PROJECT IDENTITY

## Name

MediaPulse

## V1 title

**MediaPulse — AI-Powered Movie Personality & Recommendation Engine**

## Tagline

> Discover what your movie taste says about you.

## Repository

```text
mediapulse
```

## Project purpose

This is both:

1. a real functional web application
2. a public GitHub portfolio project demonstrating professional software engineering

---

# 4. V1 SCOPE

V1 is intentionally limited.

## Included

- Movie personality analysis
- Movie taste interview
- Adaptive AI interview architecture
- Gemini integration
- Structured AI output
- TMDB integration
- Personalized movie recommendations
- Movie personality results page
- Movie recommendation cards
- Shareable Movie Profile Card
- Download/share functionality
- Retake quiz
- Responsive UI
- Accessibility
- Loading states
- Error states
- Validation
- Testing
- Deployment
- Professional README/documentation

The original V1 requirements specifically define the quiz → AI personality → TMDB recommendation → shareable profile experience.

---

# 5. V1 EXPLICITLY DOES NOT INCLUDE

Do NOT add these during V1:

```text
Music recommendations
Spotify
User accounts
Authentication
Google login
GitHub login
Email/password login
Database
Watchlists
Social feed
User comments
Paid APIs
Native mobile application
Admin dashboard
Complex ML recommendation model
```

The V1 requirements explicitly mark these features as out of scope.

These may be future V2/V3 ideas.

Do not build them now.

---

# 6. COST REQUIREMENT

**$0 cost is a hard V1 requirement.**

The project should prioritize:

- free developer tiers
- open-source libraries
- free hosting
- client-side processing where practical
- no paid SaaS
- no unnecessary infrastructure

The project specification explicitly requires us to verify external service pricing/free-tier conditions rather than simply assuming something is free.

Do not introduce paid infrastructure without explicit approval.

---

# 7. THE ACTUAL USER EXPERIENCE

The V1 requirements originally described approximately six movie-taste questions.

The original conceptual questions cover:

### Mood

Examples:

- Dark & Mysterious
- Feel-Good
- Emotional
- Intense
- Nostalgic
- Dreamy

### Story Type

Examples:

- Mind-bending
- Character-driven
- Epic adventure
- Mystery
- Romance
- Psychological
- Slice-of-life

### Visual Aesthetic

Examples:

- Neon futuristic city
- Rainy city at night
- Golden-hour countryside
- Dark gothic environment
- Retro 80s atmosphere
- Vast sci-fi universe

### Pacing

Slow Burn → Fast & Intense

### Emotional Experience

Examples:

- Inspired
- Thrilled
- Moved
- Comforted
- Amazed
- Disturbed
- Thoughtful

### Movie Preference

Examples:

- Sci-Fi
- Thriller
- Drama
- Comedy
- Horror
- Fantasy
- Romance
- Mystery

These are **product/UX reference requirements**, not a command that the final implementation must permanently use six hard-coded questions.

---

# 8. IMPORTANT ARCHITECTURAL EVOLUTION — ADAPTIVE INTERVIEW

During Phase 1 architecture, we intentionally improved the original fixed-question concept.

The actual implementation should use an **AI-driven adaptive interview**.

Gemini determines what question would be most useful next based on what it has already learned about the user's movie taste.

The application remains in control of the boundaries.

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

This means the user experience still represents the original Movie Taste Quiz concept, but the underlying system is more intelligent and adaptive.

Do NOT revert this to six hard-coded questions unless explicitly instructed.

---

# 9. ALLOWED QUESTION TYPES

The adaptive interview supports:

```text
single_choice
multi_choice
free_text
```

Gemini chooses the appropriate question type based on the information it needs.

The frontend renders the appropriate component.

---

# 10. CONTROLLED TASTE MODEL

The AI interview operates around controlled taste dimensions:

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

This gives Gemini flexibility while keeping the application's data model structured.

---

# 11. INTERVIEW STATE

V1 has:

```text
NO DATABASE
NO AUTHENTICATION
NO USER ACCOUNT
```

Therefore the interview session is temporary.

The browser holds the current state.

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
   Next.js API
        │
        ▼
      Gemini
```

Do not create a database merely to store temporary quiz state.

---

# 12. GEMINI'S ROLE

Gemini is the intelligence layer.

It is responsible for understanding the user.

Gemini handles:

- adaptive interview questions
- taste interpretation
- structured taste updates
- confidence
- personality generation
- movie candidate selection
- personalized recommendation reasoning

However, Gemini does NOT control the application's boundaries.

The application validates and controls all structured AI output.

---

# 13. GEMINI INTERVIEW OUTPUT

The Gemini interview response is structured JSON.

It includes concepts such as:

```text
status
question
taste update
signals
likes
dislikes
confidence
```

The status is:

```text
continue
complete
```

Zod/application validation must be used.

Do not build the core application around unvalidated free-form Gemini responses.

---

# 14. MOVIE PERSONALITY

The Movie Personality is the centerpiece of the experience.

The V1 product requirements describe a structured personality such as:

```json
{
  "personaTitle": "The Midnight Mind-Bender",
  "description": "You gravitate toward atmospheric stories that challenge your perception of reality...",
  "preferredGenres": [
    "Science Fiction",
    "Thriller",
    "Mystery"
  ],
  "preferredThemes": [
    "Identity",
    "Reality",
    "Isolation"
  ],
  "pacing": "Slow Burn",
  "tone": "Dark and Atmospheric",
  "keywords": [
    "mind-bending",
    "psychological",
    "dystopian"
  ]
}
```

This illustrates the product concept.

The exact implementation must follow the structured schemas already established during Phase 1.

The result should feel personalized rather than like a generic AI paragraph.

The V1 requirements specifically call for a memorable personality title, a 2–3 sentence personality description, and personality attributes.

---

# 15. IMPORTANT GEMINI / TMDB ARCHITECTURE

The final architecture evolved beyond the earliest product description.

The actual architecture we locked is:

```text
USER
 ↓
GEMINI
 ↓
Movie candidates
 ↓
TMDB verification
 ↓
MediaPulse results
```

The core boundary is:

## Gemini

> Understand the user and determine which movies fit them.

## TMDB

> Verify that the movies exist and provide authoritative movie metadata.

The application sits between them and controls:

- validation
- acceptance/rejection
- limits
- normalization
- orchestration
- error handling

---

# 16. RECOMMENDATION ENGINE

Gemini returns exactly **five movie candidates**.

The Gemini recommendation output contains:

```text
title
optional year
personalized reason
```

Gemini does NOT return authoritative TMDB metadata.

It does not return:

```text
TMDB ID
poster URL
backdrop URL
TMDB rating
official TMDB overview
```

Those come from TMDB.

---

# 17. TMDB VERIFICATION PIPELINE

The application verifies Gemini's candidates.

The pipeline is:

```text
Gemini candidate
      ↓
Normalize
      ↓
TMDB /search/movie
      ↓
Evaluate candidate match
      ↓
Conservative acceptance
      ↓
TMDB /movie/{id}
      ↓
Validate metadata
      ↓
Accepted movie
```

False-positive movie matches are considered worse than false negatives.

TMDB is the source of truth for verified movie information.

---

# 18. FINAL MOVIE RESULT DATA

The results UI should ultimately display information such as:

- poster
- movie title
- release year
- TMDB rating
- short overview
- genre
- optional movie detail/TMDB link

These are explicitly part of the V1 product requirements.

---

# 19. RECOMMENDATION ORCHESTRATOR

The recommendation API route is deliberately thin.

Architecture:

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

This is an important architecture decision.

Do not put the entire recommendation system directly inside:

```text
app/api/recommendations/route.ts
```

The route should remain an API boundary.

---

# 20. API ROUTES

V1 has three routes:

```text
POST /api/interview

POST /api/recommendations

GET /api/health
```

There should NOT be unnecessary provider-specific routes such as:

```text
/api/gemini
/api/tmdb
/api/movies/search
```

Gemini and TMDB are internal services.

---

# 21. FRONTEND / BACKEND RESPONSIBILITY

## Frontend

Responsible for:

- UI
- interview state
- user interaction
- animations
- question rendering
- loading states
- displaying results
- responsive behavior
- accessibility

## Server

Responsible for:

- Gemini
- TMDB
- API keys
- validation
- recommendation orchestration
- external API handling
- normalization
- error handling

API keys must never be exposed to client-side JavaScript.

---

# 22. TECHNOLOGY STACK

Locked V1 stack:

### Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
Motion / Framer Motion
```

### Backend

```text
Next.js Route Handlers
```

### AI

```text
Google Gemini
@google/genai
```

Gemini is server-side only.

### Movie data

```text
TMDB API
```

### Deployment

```text
Vercel
```

### Version control

```text
GitHub
```

### Profile card

Free/open-source/client-side approach.

---

# 23. SECURITY

Never expose:

```text
GEMINI_API_KEY
TMDB_API_KEY
```

in:

- client code
- public JavaScript
- GitHub
- `.env.example`

Development secrets belong in:

```text
.env.local
```

`.env.local` must remain ignored by Git.

`.env.example` contains placeholders only:

```text
GEMINI_API_KEY=
TMDB_API_KEY=
```

The V1 requirements explicitly establish this security boundary.

---

# 24. TARGET ARCHITECTURE

The intended project structure is:

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
│   │
│   ├── quiz/
│   │   └── page.tsx
│   │
│   ├── results/
│   │   └── page.tsx
│   │
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
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

This is the target architecture, not a requirement that every file already exists.

Inspect the actual repository before creating anything.

---

# 25. PHASE ROADMAP

The complete build is:

```text
PHASE 0 — Project & GitHub Setup
        ↓
PHASE 1 — Technical Architecture
        ↓
PHASE 2 — Application Foundation
        ↓
PHASE 3 — Design System & UI Foundation
        ↓
PHASE 4 — Landing Page
        ↓
PHASE 5 — Quiz / Adaptive Interview Engine
        ↓
PHASE 6 — Gemini AI Personality Engine
        ↓
PHASE 7 — TMDB Recommendation Engine
        ↓
PHASE 8 — Results / Movie Personality Page
        ↓
PHASE 9 — Shareable Profile Card
        ↓
PHASE 10 — Error Handling / Accessibility / Polish
        ↓
PHASE 11 — Testing & QA
        ↓
PHASE 12 — Deployment & GitHub Portfolio
        ↓
V1 COMPLETE
```

---

# 26. PHASE 0 — COMPLETE

Phase 0 established:

- MediaPulse identity
- GitHub repository
- public portfolio direction
- README foundation
- Git workflow
- `.gitignore`
- `.env.example`
- secret-management rules

The repository is:

```text
mediapulse
```

---

# 27. PHASE 1 — COMPLETE

Phase 1 established the technical architecture.

Completed decisions include:

- adaptive AI interview
- taste dimensions
- AI/application responsibility boundaries
- structured Gemini responses
- question limits
- browser state
- Gemini/TMDB responsibility boundary
- interview schema
- Gemini interview system prompt
- interview state schema
- recommendation schema
- TMDB verification contract
- API architecture
- error/fallback approach
- complete folder architecture

These are LOCKED decisions.

Do not casually redesign them.

---

# 28. PHASE 2 — COMPLETE AND VERIFIED

Phase 2 established the application foundation.

The Gemini SDK was installed:

```bash
npm install @google/genai
```

Installation succeeded.

There was a dependency warning regarding:

```text
node-domexception@1.0.0
```

but installation itself succeeded.

The repository was checked with:

```bash
git status --short
```

and was clean at the verification checkpoint.

The production build was successfully run with:

```bash
npm run build
```

The project is using:

```text
Next.js 16.3.5
Turbopack
```

The build completed successfully.

Therefore Phase 2 should be treated as complete unless inspection of the actual repository shows otherwise.

---

# 29. CURRENT DEVELOPMENT POSITION

We are now at:

# PHASE 3 — DESIGN SYSTEM & UI FOUNDATION

The planned Phase 3 tasks are:

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

## CURRENT TASK

# TASK 3.1 — DEFINE THE EXACT MEDIAPULSE VISUAL DESIGN SYSTEM

---

# 30. TASK 3.1 OBJECTIVE

Before building the landing page, establish MediaPulse's visual language.

Define and lock:

- visual direction
- visual personality
- typography direction
- color philosophy
- background treatment
- spacing philosophy
- border-radius philosophy
- card philosophy
- button philosophy
- visual hierarchy
- component design principles
- overall cinematic/AI product feel

The design must support the actual MediaPulse experience:

```text
movie discovery
+
AI personality
+
cinematic identity
+
personalization
+
modern product UI
```

Do not create a generic SaaS dashboard aesthetic.

Do not build the landing page yet.

---

# 31. PHASE 3 PRINCIPLE

The V1 requirements explicitly say the landing page should be relatively minimal and polished.

The quiz must eventually support:

- one question at a time
- progress indicator
- previous/next
- animated transitions
- visual selection cards
- responsive layout
- selected-state feedback
- validation
- Generate My Profile

Those requirements should influence the design system now.

The visual system must therefore work for:

- landing page
- adaptive interview
- AI analysis state
- personality result
- movie cards
- profile card
- mobile
- desktop

---

# 32. DO NOT JUMP AHEAD

During Task 3.1, do NOT start implementing:

- landing page
- quiz engine
- Gemini integration
- TMDB integration
- results page
- profile-card generation

First establish the design direction.

Later Phase 3 tasks will turn that direction into actual reusable implementation.

---

# 33. HOW TO TAKE OVER THE LOCAL PROJECT

First inspect the real repository.

Run:

```bash
git status
git branch
git log --oneline -10
```

Then inspect the current structure.

Check:

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
public/
globals.css
```

Also inspect Tailwind/CSS configuration currently present.

Do NOT assume the repository exactly matches the target architecture above.

The local repository is the actual implementation state.

---

# 34. IMPORTANT: PRESERVE EXISTING WORK

If the repository differs from the target architecture:

Determine whether the difference is:

1. intentional
2. already implemented differently
3. unfinished
4. accidental

Do not overwrite working code simply to make it look identical to the architecture document.

---

# 35. VERIFICATION RULE

Every task must be verified.

After implementation, run appropriate checks.

At minimum maintain:

```bash
npm run build
```

If the repository has a lint command, also run:

```bash
npm run lint
```

Do not claim verification unless the command was actually executed.

---

# 36. GIT RULE

Do not automatically commit changes.

First report:

```text
Task completed
Files changed
Design decisions
Verification performed
Verification results
Remaining issues
Recommended commit
```

Once verified, a suitable Task 3.1 commit would likely be:

```text
feat: define MediaPulse visual design system
```

But do not commit unless explicitly requested.

---

# 37. PORTFOLIO REQUIREMENT

Remember that this is not merely a coding exercise.

The final GitHub repository should clearly demonstrate:

- thoughtful architecture
- AI integration
- API integration
- validation
- frontend engineering
- responsive design
- accessibility
- error handling
- testing
- deployment
- documentation

The development history should make those decisions visible.

---

# 38. FINAL TAKEOVER INSTRUCTION

You are now working on the **existing local MediaPulse repository**.

This is NOT a new project.

The product requirements are already defined.

The architecture is already defined.

Phase 0 is complete.

Phase 1 is complete.

Phase 2 is complete and verified.

The current task is:

# PHASE 3 → TASK 3.1

## Define and lock the exact MediaPulse visual design system.

Start by:

1. Inspecting the actual repository.
2. Inspecting the current Git state.
3. Inspecting the existing styling/configuration.
4. Comparing the implementation against the established MediaPulse requirements.
5. Designing Task 3.1 around the actual MediaPulse product.
6. Implementing only what Task 3.1 requires.
7. Verifying the result.
8. Reporting exactly what changed.

Do not restart.

Do not redesign the architecture.

Do not revert the adaptive interview.

Do not add authentication/database/music.

Do not jump to Phase 4.

Continue from the existing MediaPulse project.