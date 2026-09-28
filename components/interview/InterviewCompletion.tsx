"use client";

import { Button } from "@/components/ui/Button";

interface InterviewCompletionProps {
	onGenerateRecommendations: () => void;
}

export function InterviewCompletion({
	onGenerateRecommendations,
}: InterviewCompletionProps) {
	return (
		<section
			aria-labelledby="interview-completion-title"
			className="motion-result-reveal space-y-6 py-4 text-center sm:py-8"
		>
			<p className="type-label text-accent">MEDIAPULSE · YOUR PROFILE</p>
			<div className="space-y-3">
				<h2 id="interview-completion-title" className="text-3xl sm:text-4xl">
					Taste Profile Ready
				</h2>
				<p className="mx-auto max-w-lg text-sm text-muted sm:text-base">
					Your answers have shaped a clearer picture of the stories and films you
					love. You can now find recommendations chosen for your taste.
				</p>
			</div>
			<Button
				className="w-full sm:w-auto"
				onClick={onGenerateRecommendations}
			>
				Generate Recommendations
				<span aria-hidden="true">→</span>
			</Button>
		</section>
	);
}
