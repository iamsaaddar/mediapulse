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
			className="motion-result-reveal space-y-6 py-4 text-center sm:py-8"
		>
			<div className="space-y-3">
				<p className="type-label text-accent">YOUR MOVIE PERSONALITY</p>
				<h2 id="interview-completion-title" className="text-3xl sm:text-4xl">
					{personality.title}
				</h2>
				<p className="mx-auto max-w-3xl text-sm text-muted sm:text-base">
					{personality.description}
				</p>
			</div>
			<ResultsExperience
				personality={personality}
				tasteProfile={tasteProfile}
				recommendation={recommendation}
				onRetryRecommendations={onRetryRecommendations}
				onRetake={onRetake}
			/>
		</section>
	);
}
