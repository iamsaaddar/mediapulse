"use client";

import { ResultsExperience } from "@/components/results/ResultsExperience";
import type { InterviewPersonality } from "@/types/interview";
import type { RecommendationHandoffState } from "@/types/recommendation";

interface InterviewCompletionProps {
	personality: InterviewPersonality;
	recommendation: RecommendationHandoffState;
	onRetryRecommendations: () => void;
	onRetake: () => void;
}

export function InterviewCompletion({
	personality,
	recommendation,
	onRetryRecommendations,
	onRetake,
}: InterviewCompletionProps) {
	return (
		<main className="results-page">
			<section
				className="interview-completion motion-result-reveal"
				aria-label="Your movie recommendations"
			>
				<ResultsExperience
					personality={personality}
					recommendation={recommendation}
					onRetryRecommendations={onRetryRecommendations}
					onRetake={onRetake}
				/>
			</section>
		</main>
	);
}
