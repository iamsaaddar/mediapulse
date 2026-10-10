"use client";

import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { InterviewPersonality } from "@/types/interview";
import type { RecommendationHandoffState } from "@/types/recommendation";

interface InterviewCompletionProps {
	personality: InterviewPersonality;
	recommendation: RecommendationHandoffState;
	onRetryRecommendations: () => void;
}

export function InterviewCompletion({
	personality,
	recommendation,
	onRetryRecommendations,
}: InterviewCompletionProps) {
	return (
		<section
			aria-labelledby="interview-completion-title"
			className="motion-result-reveal space-y-6 py-4 text-center sm:py-8"
		>
			<p className="type-label text-accent">MEDIAPULSE · YOUR PROFILE</p>
			<div className="space-y-3">
				<p className="type-label text-muted">YOUR MOVIE PERSONALITY</p>
				<h2 id="interview-completion-title" className="text-3xl sm:text-4xl">
					{personality.title}
				</h2>
				<p className="mx-auto max-w-lg text-sm text-muted sm:text-base">
					{personality.description}
				</p>
			</div>
			<div aria-live="polite" className="mx-auto max-w-lg">
				{recommendation.status === "loading" ? (
					<div role="status" className="space-y-2 text-sm text-muted">
						<p>Analyzing your movie taste…</p>
						<ul className="space-y-1">
							<li>Understanding your preferences</li>
							<li>Mapping your cinematic personality</li>
							<li>Finding your movie patterns</li>
							<li>Preparing your recommendations</li>
						</ul>
					</div>
				) : recommendation.status === "success" ? (
					<p className="text-sm text-muted" role="status">
						Your verified movie recommendations are ready.
					</p>
				) : recommendation.status === "error" ? (
					<ErrorMessage
						title="Recommendations unavailable"
						message={recommendation.message}
						action={
							<Button variant="secondary" onClick={onRetryRecommendations}>
								Try recommendations again
							</Button>
						}
					/>
				) : null}
			</div>
		</section>
	);
}
