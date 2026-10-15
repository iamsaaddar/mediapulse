import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { InterviewPersonality } from "@/types/interview";
import type {
	RecommendationHandoffState,
	RecommendationResponse,
} from "@/types/recommendation";

import { MovieCard } from "./MovieCard";
import { PersonalityCard } from "./PersonalityCard";

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

interface ResultsExperienceProps {
	personality: InterviewPersonality;
	recommendation: RecommendationHandoffState;
	onRetryRecommendations: () => void;
	onRetake: () => void;
}

export function ResultsExperience({
	personality,
	recommendation,
	onRetryRecommendations,
	onRetake,
}: ResultsExperienceProps) {
	const response = recommendation.status === "success" ? recommendation.response : null;
	const movies = getRecommendationMovies(response);
	const isCompleteSuccess = recommendation.status === "success" && movies.length === 5;

	return (
		<div className="results-experience">
			{recommendation.status === "loading" ? (
				<div className="recommendation-pending" role="status" aria-live="polite">
					<p className="type-label">From the projection booth</p>
					<h2>Picking out your films.</h2>
					<p>Your personal collection is being prepared.</p>
					<div className="recommendation-pending__lines" aria-hidden="true">
						<span /><span /><span />
					</div>
				</div>
			) : null}

			{recommendation.status === "error" ? (
				<ErrorMessage
					title="Your collection is not ready"
					message={recommendation.message}
					action={
						<div className="flex flex-wrap gap-3">
							<Button variant="secondary" onClick={onRetryRecommendations}>Try again</Button>
							<Button variant="ghost" onClick={onRetake}>Take the quiz again</Button>
						</div>
					}
				/>
			) : null}

			{recommendation.status === "success" ? (
				<section className="movie-library" aria-labelledby="results-section-title">
					<header className="movie-library__heading">
						<div>
							<p className="type-label">CURATED FOR YOUR NEXT MOVIE NIGHT</p>
							<h2 id="results-section-title">Your film shelf.</h2>
						</div>
						<span className="movie-library__count">05 <span>FILMS</span></span>
					</header>

					{!isCompleteSuccess ? (
						<ErrorMessage
							title="Your collection is incomplete"
							message="We couldn’t verify the complete set of films. Please try again."
							action={<Button variant="secondary" onClick={onRetryRecommendations}>Try again</Button>}
						/>
					) : (
						<div className="movie-library__shelf">
							{movies.map((item, index) => (
								<MovieCard
									key={item.movie.tmdbId}
									movie={item.movie}
									reason={item.reason}
									index={index}
								/>
							))}
						</div>
					)}
				</section>
			) : null}

			<PersonalityCard personality={personality} />

			{recommendation.status === "success" ? (
				<div className="results-experience__reset">
					<Button variant="ghost" onClick={onRetake}>Choose a different double feature</Button>
				</div>
			) : null}
		</div>
	);
}
