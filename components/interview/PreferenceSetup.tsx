"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./interview.module.css";
import { cxModule } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { DECADES, SUPPORTED_LANGUAGES } from "@/constants/preferences";
import { TMDB_MOVIE_GENRES } from "@/constants/movie-genres";
import type { VibeKeyword, VibeExtractionResponse } from "@/schemas/vibes";

type SetupStep = "anchor" | "vibes" | "genres" | "decades" | "language";
const steps: SetupStep[] = ["anchor", "vibes", "genres", "decades", "language"];
const stepImages: Record<SetupStep, string> = {
  anchor: "/images/mediapulse/anchor-movie-page.jpg",
  vibes: "/images/mediapulse/vibes.jpg",
  genres: "/images/mediapulse/genres.jpg",
  decades: "/images/mediapulse/decade.jpg",
  language: "/images/mediapulse/language.jpg",
};
const stepTitles: Record<SetupStep, string> = {
  anchor: "Begin with a favorite.",
  vibes: "Keep what feels like you.",
  genres: "Choose your kind of story.",
  decades: "Pick an era, or leave it open.",
  language: "Set the language of your night.",
};
const stepDescriptions: Record<SetupStep, string> = {
  anchor: "One film gives us a place to start.",
  vibes: "We found a few qualities in your film. Choose at least one to follow.",
  genres: "We’ll keep your picks within these genres. Skip this to stay open.",
  decades: "Choose as many eras as you like, or explore across time.",
  language: "Choose original languages, or let the whole world in.",
};
const stepNames: Record<SetupStep, string> = {
  anchor: "Your film",
  vibes: "The feeling",
  genres: "Genres",
  decades: "The era",
  language: "Language",
};

interface PreferenceSetupProps {
  movieTitle: string;
  onMovieTitleChange: (value: string) => void;
  anchorNote: string;
  onAnchorNoteChange: (value: string) => void;
  vibes: VibeExtractionResponse | null;
  selectedVibes: VibeKeyword[];
  selectedGenreIds: number[];
  selectedDecades: number[];
  selectedLanguages: string[];
  isPending: boolean;
  errorMessage: string | null;
  onExtract: () => Promise<boolean>;
  onStartInterview: () => void;
  onToggleVibe: (vibe: VibeKeyword) => void;
  onToggleGenre: (genreId: number) => void;
  onClearGenres: () => void;
  onToggleDecade: (decade: number) => void;
  onToggleLanguage: (language: string) => void;
}

function categoryLabel(category: VibeKeyword["category"]): string {
  return category.replace("_", " ");
}

export function PreferenceSetup(props: PreferenceSetupProps) {
  const {
    movieTitle, onMovieTitleChange, anchorNote, onAnchorNoteChange, vibes,
    selectedVibes, selectedGenreIds, selectedDecades, selectedLanguages,
    isPending, errorMessage, onExtract, onStartInterview, onToggleVibe,
    onToggleGenre, onClearGenres, onToggleDecade, onToggleLanguage,
  } = props;
  const [step, setStep] = useState<SetupStep>(vibes ? "vibes" : "anchor");
  const stepIndex = steps.indexOf(step);

  function goBack() {
    setStep(steps[Math.max(0, stepIndex - 1)]);
  }

  function goNext() {
    if (step === "vibes" && selectedVibes.length === 0) return;
    if (step === "language") {
      onStartInterview();
      return;
    }
    setStep(steps[Math.min(steps.length - 1, stepIndex + 1)]);
  }

  async function handleAnchorSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onExtract()) setStep("vibes");
  }

  return (
    <main className={cxModule(styles, `discovery-setup discovery-setup--${step}`)}>
      <Image className={cxModule(styles, "discovery-setup__backdrop")} src={stepImages[step]} alt="" fill priority sizes="100vw" />
      <div className={cxModule(styles, "discovery-setup__shade")} aria-hidden="true" />
      <section className={cxModule(styles, "discovery-setup__content")} aria-labelledby="discovery-step-title" aria-busy={isPending || undefined}>
        <header className={cxModule(styles, "discovery-setup__header")}>
          <p className={cxModule(styles, "discovery-setup__kicker")}>A FILM, THEN A FEELING</p>
          <div
            className={cxModule(styles, "discovery-setup__progress")}
            role="progressbar"
            aria-label="Preference setup"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={stepIndex + 1}
            aria-valuetext={`Step ${stepIndex + 1} of ${steps.length}: ${stepNames[step]}`}
          >
            <span>{String(stepIndex + 1).padStart(2, "0")}</span>
            <span className={cxModule(styles, "discovery-setup__progress-track")} aria-hidden="true"><span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></span>
            <span>{String(steps.length).padStart(2, "0")}</span>
          </div>
        </header>

        <div className={cxModule(styles, "discovery-setup__body")}>
          <p className={cxModule(styles, "discovery-setup__step-name")}>{stepNames[step]}</p>
          <h1 id="discovery-step-title">{stepTitles[step]}</h1>
          <p className={cxModule(styles, "discovery-setup__description")}>
            {step === "vibes" && vibes ? `A few qualities surfaced in ${vibes.movieTitle}. Choose the ones you want more of.` : stepDescriptions[step]}
          </p>

          {step === "anchor" ? (
            <form className={cxModule(styles, "discovery-setup__form")} onSubmit={handleAnchorSubmit}>
              <label htmlFor="anchor-movie">A movie you love</label>
              <input id="anchor-movie" value={movieTitle} onChange={(event) => onMovieTitleChange(event.target.value)} maxLength={150} placeholder="Search a film by title" autoComplete="off" disabled={isPending} required />
              <label htmlFor="anchor-note">What stays with you about it? <span>Optional</span></label>
              <textarea id="anchor-note" value={anchorNote} onChange={(event) => onAnchorNoteChange(event.target.value)} maxLength={200} rows={2} placeholder="A mood, a character, a world…" disabled={isPending} />
              <Button type="submit" loading={isPending} disabled={!movieTitle.trim()} className={cxModule(styles, "discovery-setup__primary")}>
                {isPending ? "Finding its qualities" : "Find the feeling"}
              </Button>
            </form>
          ) : null}

          {step === "vibes" && vibes ? (
            <div className={cxModule(styles, "discovery-setup__choices")} role="group" aria-label="Movie qualities">
              {vibes.vibeKeywords.map((vibe) => {
                const selected = selectedVibes.some((item) => item.tag === vibe.tag);
                return <button key={`${vibe.category}-${vibe.tag}`} type="button" className={cxModule(styles, `discovery-choice${selected ? " discovery-choice--selected" : ""}`)} aria-pressed={selected} disabled={isPending} onClick={() => onToggleVibe(vibe)}><span>{vibe.tag}</span><small>{categoryLabel(vibe.category)}</small></button>;
              })}
            </div>
          ) : null}

          {step === "genres" ? (
            <div className={cxModule(styles, "discovery-setup__choices")} role="group" aria-label="Movie genres">
              <button type="button" className={cxModule(styles, `discovery-choice${selectedGenreIds.length === 0 ? " discovery-choice--selected" : ""}`)} aria-pressed={selectedGenreIds.length === 0} disabled={isPending} onClick={onClearGenres}>Any genre</button>
              {TMDB_MOVIE_GENRES.map(({ id, name }) => <button key={id} type="button" className={cxModule(styles, `discovery-choice${selectedGenreIds.includes(id) ? " discovery-choice--selected" : ""}`)} aria-pressed={selectedGenreIds.includes(id)} disabled={isPending} onClick={() => onToggleGenre(id)}>{name}</button>)}
            </div>
          ) : null}

          {step === "decades" ? (
            <div className={cxModule(styles, "discovery-setup__choices discovery-setup__choices--compact")} role="group" aria-label="Release decades">
              <button type="button" className={cxModule(styles, `discovery-choice${selectedDecades.length === 0 ? " discovery-choice--selected" : ""}`)} aria-pressed={selectedDecades.length === 0} disabled={isPending} onClick={() => selectedDecades.forEach(onToggleDecade)}>Any era</button>
              {DECADES.map((decade) => <button key={decade} type="button" className={cxModule(styles, `discovery-choice${selectedDecades.includes(decade) ? " discovery-choice--selected" : ""}`)} aria-pressed={selectedDecades.includes(decade)} disabled={isPending} onClick={() => onToggleDecade(decade)}>{decade}s</button>)}
            </div>
          ) : null}

          {step === "language" ? (
            <div className={cxModule(styles, "discovery-setup__choices discovery-setup__choices--compact")} role="group" aria-label="Original languages">
              <button type="button" className={cxModule(styles, `discovery-choice${selectedLanguages.length === 0 ? " discovery-choice--selected" : ""}`)} aria-pressed={selectedLanguages.length === 0} disabled={isPending} onClick={() => selectedLanguages.forEach(onToggleLanguage)}>Any language</button>
              {SUPPORTED_LANGUAGES.map(({ code, label }) => <button key={code} type="button" className={cxModule(styles, `discovery-choice${selectedLanguages.includes(code) ? " discovery-choice--selected" : ""}`)} aria-pressed={selectedLanguages.includes(code)} disabled={isPending} onClick={() => onToggleLanguage(code)}>{label}</button>)}
            </div>
          ) : null}

          {step !== "anchor" ? (
            <nav className={cxModule(styles, "discovery-setup__actions")} aria-label="Preference steps">
              <Button variant="ghost" disabled={isPending} onClick={goBack}>Back</Button>
              <Button disabled={isPending || (step === "vibes" && selectedVibes.length === 0)} onClick={goNext} className={cxModule(styles, "discovery-setup__primary")}>
                {step === "language" ? "Start the conversation" : "Continue"}
              </Button>
            </nav>
          ) : null}

          {step === "vibes" && selectedVibes.length === 0 ? <p className={cxModule(styles, "discovery-setup__hint")}>Choose one or more qualities to continue.</p> : null}
          {errorMessage ? <p className={cxModule(styles, "discovery-setup__error")} role="alert">{errorMessage}</p> : null}
        </div>
      </section>
    </main>
  );
}
