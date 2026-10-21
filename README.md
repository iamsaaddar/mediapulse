# MediaPulse 🎬

### Discover your movie personality. Find films that match your taste.

MediaPulse is an AI-powered movie discovery app that goes beyond genres and ratings to understand **why you enjoy the movies you love**.

Through an adaptive AI interview, MediaPulse learns about your cinematic preferences, builds a personalized movie personality, and recommends five films tailored to your taste. Google Gemini powers the interview and recommendation process, while TMDB verifies movie identities and provides movie metadata.

**Gemini proposes. TMDB verifies. MediaPulse decides.**

[**Live Demo**](https://mediapulse-movie.vercel.app/) 

> **Project status:** Core experience implemented. Final UI refinements, release testing, and deployment are in progress.

---

## 📸 Screenshots

| Landing Page                              |
| ----------------------------------------- |
|                                           |
| <img width="1119" height="597" alt="landing-page" src="https://github.com/user-attachments/assets/e21562b6-b040-4d39-9fae-dd9b7a7aa217" /> 


| Adaptive Interview                      |
| --------------------------------------- |
|                                         |
| <img width="1044" height="620" alt="adaptive-interview" src="https://github.com/user-attachments/assets/546f8d6a-5ef3-4e81-9cb1-be01f8d6dd81" /> 

| Personalized Results                      |
| ----------------------------------------- |
|                                           |

| <img width="759" height="627" alt="personalized-results" src="https://github.com/user-attachments/assets/116a9bcd-6ccc-4614-8951-39f321ca91e8" />



---

## ✨ Features

- **Anchor Movie Vibes:** Enter a movie and choose from granular AI-generated cinematic textures and micro-genres.
- **Personal Filters:** Select multiple decades and original languages as hard recommendation constraints.
- **Adaptive Micro-Interview:** Answer two to five targeted questions scoped to the selected vibes.
- **Personalized Movie Personality:** A cinematic profile based on your preferences, emotional responses, narrative interests, and viewing habits.
- **Discovery-Aware Recommendations:** Five verified films ranked for taste fit and discovery, with popularity deliberately balanced rather than used as the default.
- **TMDB Movie Verification:** Candidate movies are checked against TMDB to obtain reliable identities and metadata.
- **Structured AI Responses:** Runtime schema validation helps ensure that AI-generated data follows the application's expected format.
- **Interactive Results:** Explore your movie personality, taste attributes, posters, ratings, and personalized recommendations.
- **Responsive Interface:** A cinematic, dark-themed experience designed for different screen sizes.
- **Error Handling:** Defined handling for invalid responses, failed requests, and uncertain movie matches.

---

## 🧠 How It Works

MediaPulse combines AI-driven personalization with verified movie data and user-controlled constraints.

```text
Anchor Movie → Gemini Vibe Extraction → Vibe / Decade / Language Selection
  → 2–5 Question Micro-Interview → Candidate Fit + Discovery Ranking
  → TMDB Verification + Hard Filters → Five Personalized Results
```

### 1. Choose a movie texture

Enter an anchor movie. Gemini proposes 10–15 granular vibe keywords and micro-genres. Choose the textures that match what you want; the anchor title is context, not an assumption that you like every part of that film.

### 2. Set hard filters

Select any combination of decades from the 1940s through the 2020s and supported original languages. Empty selections mean Any Era or Any Language. The server checks final TMDB release year and original-language metadata against selected filters.

### 3. Take the micro-interview

Gemini asks one adaptive question at a time, staying within the selected vibe space. The application requires at least two answered questions and caps the interview at five.

### 4. Find aesthetic matches

Gemini proposes 7–8 candidates per batch and provides a taste-fit estimate. MediaPulse searches TMDB, rejects uncertain identities and any decade or language violations, then ranks verified films using taste fit and a log-scaled inverse vote-count discovery signal. It reserves up to three spots for strong-fit lesser-known films when available.

### 5. Present the results

Success returns exactly five distinct TMDB-verified movies with personalized explanations. If five strong matches cannot meet the selected filters, the app asks the user to broaden those filters instead of silently relaxing them.

---

## 🛠️ Tech Stack

| Technology                                                  | Purpose                                             |
| ----------------------------------------------------------- | --------------------------------------------------- |
| [Next.js](https://nextjs.org/)                              | Application framework and API routes                |
| [React](https://react.dev/)                                 | User interface                                      |
| [TypeScript](https://www.typescriptlang.org/)               | Type safety                                         |
| [Tailwind CSS](https://tailwindcss.com/)                    | Styling and responsive layouts                      |
| [Google Gemini](https://ai.google.dev/)                     | Adaptive interviewing and recommendation generation |
| [Google Gen AI SDK](https://github.com/googleapis/js-genai) | Gemini integration                                  |
| [TMDB](https://www.themoviedb.org/)                         | Movie search, verification, and metadata            |
| [Zod](https://zod.dev/)                                     | Runtime schema validation                           |
| [Node.js](https://nodejs.org/)                              | JavaScript runtime                                  |

---

## 🚀 Getting Started

Follow these steps to run MediaPulse locally.

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- [Git](https://git-scm.com/)
- A Google Gemini API key
- A TMDB API key

### 1. Clone the repository

```bash
git clone https://github.com/iamsaaddar/mediapulse.git
cd mediapulse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory and add your API credentials:

```env
GEMINI_API_KEY=your_gemini_api_key
TMDB_API_KEY=your_tmdb_api_key
```

Get your credentials from:

- **Gemini:** [Google AI Studio](https://aistudio.google.com/)
- **TMDB:** [TMDB API Settings](https://www.themoviedb.org/settings/api)

Replace the example values with your own credentials.

**Security:** Keep API keys server-side. Never commit `.env.local` or expose secret credentials through client-side code. Do not prefix these keys with `NEXT_PUBLIC_`.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm run start
```

The production server starts after a successful build.

---

## ⚙️ Environment Variables

| Variable         | Description                             | Required |
| ---------------- | --------------------------------------- | -------- |
| `GEMINI_API_KEY` | Authenticates requests to Google Gemini | Yes      |
| `TMDB_API_KEY`   | Authenticates requests to TMDB          | Yes      |

For deployment, configure these variables in your hosting provider's server-side environment settings.

API availability, quotas, and usage terms depend on the respective providers.

---

## 🧪 Testing

Run the project's available quality checks:

```bash
npm run lint
npm run build
```

Additional TypeScript checking:

```bash
npx tsc --noEmit
```


```bash
node --test
```


---

## 🗺️ Roadmap

- [x] Project setup and application foundation
- [x] Landing page and adaptive interview interface
- [x] Gemini-powered interview engine
- [x] AI recommendation workflow
- [x] TMDB movie verification
- [x] Core results experience
- [ ] Final UI refinements and responsive QA
- [ ] Shareable movie personality card
- [ ] Final attribution and release checks
- [ ] Production deployment
- [ ] V1 release


---

## 🔮 Future Improvements

Potential directions for future versions include:

- Shareable cinematic personality profiles
- Saved recommendations and persistent taste profiles
- Tracking how movie preferences evolve over time
- More advanced recommendation evaluation

These are future possibilities, not commitments for the initial release.

---

## 🙌 Acknowledgements

- [Google Gemini](https://ai.google.dev/) for AI-powered interviewing and recommendation generation.
- [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie discovery and metadata.

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie data and artwork are subject to TMDB's applicable terms and attribution requirements.

---

## 👨‍💻 About the Project

MediaPulse is an independent portfolio project exploring the combination of generative AI, full-stack development, and personalized movie discovery.

The project demonstrates how an AI-powered application can go beyond generating text by combining structured outputs, runtime validation, external data verification, error handling, and a dedicated user experience.

**Developer:** [IAMSAADDAR](https://github.com/iamsaaddar)



---


