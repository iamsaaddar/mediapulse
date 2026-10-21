"use client";

import { Button } from "@/components/ui/Button";
import { DECADES, SUPPORTED_LANGUAGES } from "@/constants/preferences";
import type { VibeKeyword, VibeExtractionResponse } from "@/schemas/vibes";

interface PreferenceSetupProps {
	movieTitle: string;
	onMovieTitleChange: (value: string) => void;
	vibes: VibeExtractionResponse | null;
	selectedVibes: VibeKeyword[];
	selectedDecades: number[];
	selectedLanguages: string[];
	isPending: boolean;
	errorMessage: string | null;
	onExtract: () => void;
	onStartInterview: () => void;
	onToggleVibe: (vibe: VibeKeyword) => void;
	onToggleDecade: (decade: number) => void;
	onToggleLanguage: (language: string) => void;
	onResetVibes: () => void;
}

function categoryLabel(category: VibeKeyword["category"]): string {
	return category.replace("_", " ");
}

export function PreferenceSetup(props: PreferenceSetupProps) {
	const {
		movieTitle, onMovieTitleChange, vibes, selectedVibes, selectedDecades,
		selectedLanguages, isPending, errorMessage, onExtract, onStartInterview,
		onToggleVibe, onToggleDecade, onToggleLanguage, onResetVibes,
	} = props;

	return (
		<section className="preference-setup" aria-label="Set your movie preferences" aria-busy={isPending || undefined}>
			<p className="preference-setup__eyebrow">YOUR MOVIE COMPASS</p>
			<h2>{vibes ? "Choose the feeling you want to follow" : "Start with a movie you love"}</h2>
			<p className="preference-setup__intro">
				{vibes
					? `We found some cinematic textures in ${vibes.movieTitle}. Pick the ones that feel right to you.`
					: "We’ll find the specific moods, textures, and micro-genres inside it, then shape your recommendations around your choices."}
			</p>

			{!vibes ? (
				<form className="preference-setup__anchor" onSubmit={(event) => { event.preventDefault(); onExtract(); }}>
					<label htmlFor="anchor-movie">Anchor movie</label>
					<input
						id="anchor-movie"
						value={movieTitle}
						onChange={(event) => onMovieTitleChange(event.target.value)}
						maxLength={150}
						placeholder="e.g. Twilight"
						autoComplete="off"
						disabled={isPending}
					/>
					<Button type="submit" loading={isPending} disabled={!movieTitle.trim()}>
						{isPending ? "Finding the vibes" : "Find the vibes"}
					</Button>
				</form>
			) : (
				<>
					<div className="preference-setup__section">
						<div className="preference-setup__section-heading">
							<h3>Pick your vibes</h3>
							<span>{selectedVibes.length} selected</span>
						</div>
						<div className="preference-chip-list" role="group" aria-label="Movie vibe keywords">
							{vibes.vibeKeywords.map((vibe) => {
								const selected = selectedVibes.some((item) => item.tag === vibe.tag);
								return (
									<button
										key={`${vibe.category}-${vibe.tag}`}
										type="button"
										className={`preference-chip${selected ? " preference-chip--selected" : ""}`}
										aria-pressed={selected}
										disabled={isPending}
										onClick={() => onToggleVibe(vibe)}
									>
										<span>{vibe.tag}</span>
										<small>{categoryLabel(vibe.category)}</small>
									</button>
								);
							})}
						</div>
						{selectedVibes.length === 0 ? <p className="preference-setup__hint">Choose at least one vibe to continue.</p> : null}
					</div>

					<div className="preference-setup__section">
						<div className="preference-setup__section-heading">
							<h3>Decades</h3>
							<span>{selectedDecades.length ? "Only these eras" : "Any era"}</span>
						</div>
						<div className="preference-chip-list preference-chip-list--compact" role="group" aria-label="Release decade filters">
							<button type="button" className={`preference-chip${selectedDecades.length === 0 ? " preference-chip--selected" : ""}`} aria-pressed={selectedDecades.length === 0} disabled={isPending} onClick={() => selectedDecades.forEach(onToggleDecade)}>Any Era</button>
							{DECADES.map((decade) => {
								const selected = selectedDecades.includes(decade);
								return <button key={decade} type="button" className={`preference-chip${selected ? " preference-chip--selected" : ""}`} aria-pressed={selected} disabled={isPending} onClick={() => onToggleDecade(decade)}>{decade}s</button>;
							})}
						</div>
					</div>

					<div className="preference-setup__section">
						<div className="preference-setup__section-heading">
							<h3>Original language</h3>
							<span>{selectedLanguages.length ? "Only these languages" : "Any language"}</span>
						</div>
						<div className="preference-chip-list preference-chip-list--compact" role="group" aria-label="Original language filters">
							<button type="button" className={`preference-chip${selectedLanguages.length === 0 ? " preference-chip--selected" : ""}`} aria-pressed={selectedLanguages.length === 0} disabled={isPending} onClick={() => selectedLanguages.forEach(onToggleLanguage)}>Any Language</button>
							{SUPPORTED_LANGUAGES.map(({ code, label }) => {
								const selected = selectedLanguages.includes(code);
								return <button key={code} type="button" className={`preference-chip${selected ? " preference-chip--selected" : ""}`} aria-pressed={selected} disabled={isPending} onClick={() => onToggleLanguage(code)}>{label}</button>;
							})}
						</div>
					</div>

					<div className="preference-setup__actions">
						<Button variant="ghost" disabled={isPending} onClick={onResetVibes}>Change anchor movie</Button>
						<Button loading={isPending} disabled={selectedVibes.length === 0} onClick={onStartInterview}>Start the micro-interview</Button>
					</div>
				</>
			)}

			{errorMessage ? <p className="preference-setup__error" role="alert">{errorMessage}</p> : null}
		</section>
	);
}
