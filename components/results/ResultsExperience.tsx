import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type {
	RecommendationHandoffState,
	RecommendationResponse,
} from "@/types/recommendation";
import type { TasteProfile } from "@/types/taste";

import { MovieArtwork } from "./MovieArtwork";
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
	tasteProfile: TasteProfile;
	recommendation: RecommendationHandoffState;
	onRetryRecommendations: () => void;
	onRetake: () => void;
}

export function ResultsExperience({
	tasteProfile,
	recommendation,
	onRetryRecommendations,
	onRetake,
}: ResultsExperienceProps) {
	const { signalGroups, likes, dislikes } = buildPersonalityAttributes(tasteProfile);
	const response = recommendation.status === "success" ? recommendation.response : null;
	const movies = getRecommendationMovies(response);
	const isCompleteSuccess = recommendation.status === "success" && movies.length === 5;
	const featured = movies[0];
	const featuredYear = featured?.movie.releaseDate.match(/^\d{4}/)?.[0];

	return (
		<div className="results-experience">
			{(signalGroups.length > 0 || likes.length > 0 || dislikes.length > 0) && (
				<section className="taste-summary" aria-labelledby="taste-summary-title">
					<p id="taste-summary-title" className="type-label">A few things we heard</p>

					{signalGroups.length > 0 ? (
						<div className="taste-summary__signals">
							{signalGroups.slice(0, 4).map(({ label, value }) => (
								<p key={`${label}-${value}`}><span>{label}</span>{value}</p>
							))}
						</div>
					) : null}

					{likes.length > 0 ? (
						<div className="taste-summary__note">
							<span>You gravitate toward</span> {likes.slice(0, 3).join(" · ")}
						</div>
					) : null}

					{dislikes.length > 0 ? (
						<div className="taste-summary__note">
							<span>You tend to avoid</span> {dislikes.slice(0, 3).join(" · ")}
						</div>
					) : null}
				</section>
			)}

			<div aria-live="polite">
				{recommendation.status === "loading" ? (
					<div className="recommendation-pending" role="status">
						<p className="type-label">The next scene</p>
						<h3>Finding films that fit what you told us.</h3>
						<p>Your taste profile is complete. We&apos;re checking recommendations against TMDB.</p>
						<div className="recommendation-pending__lines" aria-hidden="true">
							<span /><span /><span />
						</div>
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
				<section className="recommendation-results" aria-labelledby="results-section-title">
					<div className="results-heading">
						<p className="type-label">Your cinematic matches</p>
						<h3 id="results-section-title">A story worth staying up for.</h3>
					</div>

					{!isCompleteSuccess ? (
						<ErrorMessage
							title="Recommendation set incomplete"
							message="The recommendation service did not return a complete set of verified results. Please try again."
							action={<Button variant="secondary" onClick={onRetryRecommendations}>Try recommendations again</Button>}
						/>
					) : (
						<>
							{featured ? (
								<article className="featured-movie">
									<MovieArtwork
										title={featured.movie.title}
										artworkPath={featured.movie.backdropPath?.trim()
											? featured.movie.backdropPath
											: featured.movie.posterPath}
										alt={`${featured.movie.title} ${featured.movie.backdropPath ? "backdrop" : "poster"}`}
										sizes="(max-width: 48rem) 90vw, 46vw"
										className="featured-movie__artwork"
									/>
									<div className="featured-movie__content">
										<p className="featured-movie__metadata">
											{featuredYear}
											{featuredYear && featured.movie.rating > 0 ? " · " : ""}
											{featured.movie.rating > 0 ? `TMDB ${featured.movie.rating.toFixed(1)}` : ""}
										</p>
										<h4>{featured.movie.title}</h4>
										{featured.movie.overview.trim() ? (
											<p className="featured-movie__overview">{featured.movie.overview}</p>
										) : null}
										<div className="featured-movie__reason">
											<p className="type-label">Why this fits your taste</p>
											<p>{featured.reason}</p>
										</div>
										<a
											href={`https://www.themoviedb.org/movie/${featured.movie.tmdbId}`}
											target="_blank"
											rel="noreferrer"
											className="featured-movie__link"
											aria-label={`Explore ${featured.movie.title} on TMDB, opens in a new tab`}
										>
											Explore film on TMDB <span aria-hidden="true">↗</span>
										</a>
									</div>
								</article>
							) : null}
							<div className="more-films">
								<div className="more-films__heading">
									<div>
										<p className="type-label">And in the same spirit</p>
										<h4>A few more stories for your evening.</h4>
									</div>
									<Button variant="ghost" onClick={onRetake}>Start again</Button>
								</div>
								<div className="more-films__grid">
									{movies.slice(1).map((item) => (
										<MovieCard key={item.movie.tmdbId} movie={item.movie} reason={item.reason} />
									))}
								</div>
							</div>
						</>
					)}
				</section>
			) : null}
		</div>
	);
}
