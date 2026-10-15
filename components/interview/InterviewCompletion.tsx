"use client";

import { ResultsExperience } from "@/components/results/ResultsExperience";
import type { InterviewPersonality } from "@/types/interview";
import type { RecommendationHandoffState } from "@/types/recommendation";
import type { TasteProfile } from "@/types/taste";

interface InterviewCompletionProps {
	personality: InterviewPersonality;
	tasteProfile: TasteProfile;
	recommendation: RecommendationHandoffState;
	onRetryRecommendations: () => void;
	onRetake: () => void;
}

export function InterviewCompletion({
	personality,
	tasteProfile,
	recommendation,
	onRetryRecommendations,
	onRetake,
}: InterviewCompletionProps) {
	return (
		<section
			aria-labelledby="interview-completion-title"
			className="interview-completion motion-result-reveal"
		>
			<div className="interview-completion__intro">
				<p className="type-label">Your movie personality</p>
				<h2 id="interview-completion-title">
					{personality.title}
				</h2>
				<p>
					{personality.description}
				</p>
			</div>
			<ResultsExperience
				tasteProfile={tasteProfile}
				recommendation={recommendation}
				onRetryRecommendations={onRetryRecommendations}
				onRetake={onRetake}
			/>
		</section>
	);
}
