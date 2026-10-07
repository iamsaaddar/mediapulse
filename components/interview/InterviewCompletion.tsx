"use client";

import type { InterviewPersonality } from "@/types/interview";

interface InterviewCompletionProps {
	personality: InterviewPersonality;
}

export function InterviewCompletion({
	personality,
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
		</section>
	);
}
