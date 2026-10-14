# MediaPulse 🎬

### Discover your movie personality. Find films that match your taste.

MediaPulse is an AI-powered movie discovery app that goes beyond genres and ratings to understand **why you enjoy the movies you love**.

Through an adaptive AI interview, MediaPulse learns about your cinematic preferences, builds a personalized movie personality, and recommends five films tailored to your taste. Google Gemini powers the interview and recommendation process, while TMDB verifies movie identities and provides movie metadata.

**Gemini proposes. TMDB verifies. MediaPulse decides.**

[**Live Demo**](mediapulse-movie.vercel.app) 

> **Project status:** Core experience implemented. Final UI refinements, release testing, and deployment are in progress.

---

## 📸 Screenshots

| Landing Page                              | Adaptive Interview                      |
| ----------------------------------------- | --------------------------------------- |
|                                           |                                         |
| (\screenshots\landing-page.png) | (\screenshots\adaptive-interview.png) |

### Personalized Results



(\screenshots\personalized-results.png)


---

## ✨ Features

- **Adaptive AI Interview:** Dynamically generated questions that respond to your previous answers instead of following a fixed questionnaire.
- **Personalized Movie Personality:** A cinematic profile based on your preferences, emotional responses, narrative interests, and viewing habits.
- **Tailored Recommendations:** Five movie recommendations with explanations of why each film may suit your taste.
- **TMDB Movie Verification:** Candidate movies are checked against TMDB to obtain reliable identities and metadata.
- **Structured AI Responses:** Runtime schema validation helps ensure that AI-generated data follows the application's expected format.
- **Interactive Results:** Explore your movie personality, taste attributes, posters, ratings, and personalized recommendations.
- **Responsive Interface:** A cinematic, dark-themed experience designed for different screen sizes.
- **Error Handling:** Defined handling for invalid responses, failed requests, and uncertain movie matches.

---

## 🧠 How It Works

MediaPulse combines AI-driven personalization with verified movie data.

```text
User
  |
  v
Adaptive AI Interview
  |
  v
Structured Taste Profile
  |
  v
AI-Generated Recommendations
  |
  v
TMDB Search & Verification
  |
  v
Personalized Results
```

### 1. Understand the viewer

Google Gemini generates relevant interview questions based on the user's previous answers. The application enforces interview boundaries to keep the experience manageable.

### 2. Build a taste profile

The collected answers form a structured representation of the user's cinematic preferences, including interests in stories, characters, emotions, themes, pacing, and endings.

### 3. Generate recommendations

Gemini uses the completed taste profile to propose five movies and provide personalized explanations for each recommendation.

### 4. Verify movie data

MediaPulse searches TMDB for each candidate and evaluates whether the returned movie is a sufficiently reliable match. Uncertain matches can be rejected instead of displaying potentially incorrect information.

### 5. Present the results

Verified movie metadata and personalized explanations are combined into a results experience that presents the user's movie personality and recommendations.

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


