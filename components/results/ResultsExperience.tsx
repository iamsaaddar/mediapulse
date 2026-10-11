import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { InterviewPersonality } from "@/types/interview";
import type {
	RecommendationHandoffState,
	RecommendationResponse,
} from "@/types/recommendation";
import type { TasteProfile } from "@/types/taste";

import { MovieCard } from "./MovieCard";

const TASTE_DIMENSION_LABELS: Record<string, string> = {
	story: "Story",
	emotion: "Emotion",
	characters: "Characters",
	genre: "Genre",
	tone: "Tone",
	pacing: "Pacing",
	complexity: "Complexity",
	themes: "Themes",
	visual_style: "Visual style",
	ending_preference: "Ending preference",
};

export function formatDimensionLabel(dimension: string): string {
	return (
		TASTE_DIMENSION_LABELS[dimension] ??
		dimension
			.replace(/_/g, " ")
			.replace(/\b\w/g, (match) => match.toUpperCase())
	);
}

export function getRecommendationMovies(
	response?: RecommendationResponse | null,
): RecommendationResponse["recommendations"] {
	const items = response?.recommendations ?? [];
	const unique: RecommendationResponse["recommendations"] = [];
	const seen = new Set<number>();

	for (const item of items) {
		const tmdbId = item?.movie?.tmdbId;
		if (!tmdbId || seen.has(tmdbId)) continue;
		seen.add(tmdbId);
		unique.push(item);
	}

	return unique.slice(0, 5);
}

export function buildPersonalityAttributes(tasteProfile: TasteProfile) {
	const signalGroups = tasteProfile.signals
		.map((signal) => ({
			label: formatDimensionLabel(signal.dimension),
			value: signal.value.trim(),
		}))
		.filter(({ value }) => value.length > 0);

	const likes = tasteProfile.likes.filter((item) => item.trim().length > 0);
	const dislikes = tasteProfile.dislikes.filter((item) => item.trim().length > 0);

	return { signalGroups, likes, dislikes };
}

interface ResultsExperienceProps {
	personality: InterviewPersonality;
	tasteProfile: TasteProfile;
	recommendation: RecommendationHandoffState;
	onRetryRecommendations: () => void;
	onRetake: () => void;
}

export function ResultsExperience({
	personality,
	tasteProfile,
	recommendation,
	onRetryRecommendations,
	onRetake,
}: ResultsExperienceProps) {
	const { signalGroups, likes, dislikes } = buildPersonalityAttributes(tasteProfile);
	const response = recommendation.status === "success" ? recommendation.response : null;
	const movies = getRecommendationMovies(response);
	const isCompleteSuccess = recommendation.status === "success" && movies.length === 5;

	return (
		<div className="space-y-8 pt-2">
			<section className="space-y-6 rounded-2xl border border-border bg-surface/60 p-5 sm:p-6">
				<div className="space-y-3">
					<p className="type-label text-accent">MEDIAPULSE · YOUR PROFILE</p>
					<h2 className="text-3xl sm:text-4xl">{personality.title}</h2>
					<p className="max-w-3xl text-sm text-muted sm:text-base">{personality.description}</p>
				</div>
			</section>

			{(signalGroups.length > 0 || likes.length > 0 || dislikes.length > 0) && (
				<section className="space-y-4 rounded-2xl border border-border bg-surface/60 p-5 sm:p-6">
					<p className="type-label text-accent">PERSONALITY TRAITS</p>

					{signalGroups.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{signalGroups.map(({ label, value }) => (
								<Badge key={`${label}-${value}`} variant="muted" className="text-foreground">
									{label}: {value}
								</Badge>
							))}
						</div>
					) : null}

					{likes.length > 0 ? (
						<div className="space-y-2">
							<p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">What you lean toward</p>
							<div className="flex flex-wrap gap-2">
								{likes.map((item, index) => (
									<Badge key={`like-${index}`} variant="default" className="bg-accent-subtle text-accent">
										{item}
									</Badge>
								))}
							</div>
						</div>
					) : null}

					{dislikes.length > 0 ? (
						<div className="space-y-2">
							<p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">What tends to miss</p>
							<div className="flex flex-wrap gap-2">
								{dislikes.map((item, index) => (
									<Badge key={`dislike-${index}`} variant="default" className="bg-error/10 text-error">
										{item}
									</Badge>
								))}
							</div>
						</div>
					) : null}
				</section>
			)}

			<div aria-live="polite" className="space-y-4">
				{recommendation.status === "loading" ? (
					<div className="rounded-2xl border border-border bg-surface/60 p-5 text-left sm:p-6">
						<p className="type-label text-accent">RECOMMENDATION ANALYSIS</p>
						<p className="mt-3 text-base text-foreground">Analyzing your taste profile and curating a final set of movies.</p>
						<ul className="mt-4 space-y-2 text-sm text-muted">
							<li>Matching your personality to verified films</li>
							<li>Checking the strongest TMDB matches</li>
							<li>Preparing your five personalized picks</li>
						</ul>
					</div>
				) : recommendation.status === "error" ? (
					<ErrorMessage
						title="Recommendations unavailable"
						message={recommendation.message}
						action={
							<div className="flex flex-wrap gap-3">
								<Button variant="secondary" onClick={onRetryRecommendations}>Try recommendations again</Button>
								<Button variant="ghost" onClick={onRetake}>Take the quiz again</Button>
							</div>
						}
					/>
				) : null}
			</div>

			{recommendation.status === "success" ? (
				<section className="space-y-5" aria-labelledby="results-section-title">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="type-label text-accent">VERIFIED RECOMMENDATIONS</p>
							<h3 id="results-section-title" className="mt-2 text-2xl sm:text-3xl">Your five movie matches</h3>
						</div>
						<Button variant="secondary" onClick={onRetake}>Take the quiz again</Button>
					</div>

					{!isCompleteSuccess ? (
						<ErrorMessage
							title="Recommendation set incomplete"
							message="The recommendation service did not return a complete set of verified results. Please try again."
							action={<Button variant="secondary" onClick={onRetryRecommendations}>Try recommendations again</Button>}
						/>
					) : (
						<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
							{movies.map((item) => (
								<MovieCard key={item.movie.tmdbId} movie={item.movie} reason={item.reason} />
							))}
						</div>
					)}
				</section>
			) : null}
		</div>
	);
}
