# Project Specification: VibeType – AI-Powered Movie & Music Personality Profiler

## 1. Project Overview & Core Concept
Build a full-stack, responsive web application called "VibeType." The application uses an interactive, step-by-step quiz to gather a user's aesthetic, emotional, and narrative preferences. Based on these answers, an AI Engine generates a personalized "Media Persona/Badge" (e.g., "Neon-Lit Neo-Noir Dreamer") with a custom profile summary. It then queries real-time movie and music APIs to present a highly tailored recommendation list matching that specific vibe.

---

## 2. Target Tech Stack (100% Free Tier Compatible)
- Frontend: Next.js (React) or Vite + React with Tailwind CSS for modern, high-grade styling and motion effects (Framer Motion).
- Backend: Next.js API Routes (Serverless) OR Node.js / Express backend.
- AI Model: Google Gemini API (Free Developer Tier via Google AI Studio).
- External Data APIs:
  - TMDB API (The Movie Database) for movies/TV shows.
  - Spotify Web API for music tracks/albums.
- Deployment: Vercel (Frontend/API) + GitHub for version control.

---

## 3. Core Features & User Journey

### A. Landing Page & Onboarding
- Modern, immersive landing page with a hero headline, brief description, and a single call-to-action button: "Discover Your Vibe Profile."

### B. Interactive Vibe Quiz (5–7 Questions)
- Dynamic multi-step questionnaire with smooth transitions.
- Question types include visual card selections, slider scales (e.g., "Mellow/Ambient" vs. "High Energy/Intense"), and multiple-choice options.
- Topics covered:
  1. Primary Mood/Emotional State (e.g., Melancholic, Energetic, Nostalgic, Cyberpunk/Futuristic).
  2. Narrative Tone / Favorite Tropes (e.g., Mind-bending twists, Cozy Slice-of-Life, Dark/Gritty thriller).
  3. Visual & Sound Aesthetic (e.g., Neon synthwave, Rainy acoustic night, Golden hour vintage).
  4. Pacing Preference (e.g., Slow-burn, Adrenaline-packed, Atmospheric/Lo-fi).

### C. AI Persona & Badge Generation
- Upon quiz submission, the frontend sends answers to the backend API route.
- The backend prompts the Gemini API using structured JSON output mode to generate:
  - Persona Title (e.g., "Midnight Neon Philosopher").
  - Personality Description (2–3 sentence analysis of their taste).
  - Search Keywords/Genres for movies (for TMDB API).
  - Search Keywords/Genres for music (for Spotify API).

### D. Dynamic Recommendation Engine
- Movie Fetcher: Queries TMDB API using genres/keywords returned by Gemini to retrieve 3–5 movies with title, poster image, rating, year, and plot summary.
- Music Fetcher: Queries Spotify API to retrieve 3–5 tracks/albums with album art, artist, title, and preview link.

### E. Shareable Profile Dashboard
- Renders a visually appealing "Taste Card" displaying:
  - User's Generated Badge Title & Description.
  - Recommended Movies & Music lists with high-res artwork.
  - A "Share / Download Profile" feature (using `html-to-image` or simple URL sharing).
  - Option to "Retake Quiz."

---

## 4. Technical Architecture & System Flow

1. User completes quiz on Client (React State).
2. Client sends payload to `/api/generate-vibe`:
   `{ mood: "Rainy Night", trope: "Mind-bending", aesthetic: "Neon Synthwave", pacing: "Slow-burn" }`
3. Backend receives request → constructs prompt → calls Gemini API.
4. Gemini API responds with structured JSON:
   ```json
   {
     "badgeTitle": "Cyberpunk Solitude",
     "description": "You crave deep, atmospheric stories with synth-heavy soundscapes...",
     "tmdbGenres": [878, 53],
     "tmdbKeywords": "cyberpunk, dystopia, neon",
     "spotifyGenre": "synthwave",
     "musicQuery": "atmospheric synthwave chill"
   }