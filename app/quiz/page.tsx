"use client";

import Link from "next/link";
import { useState } from "react";

import { InterviewContainer } from "@/components/interview/InterviewContainer";
import { Container } from "@/components/ui/Container";
import { appendMockFollowUpIfHelpful, createMockInterviewState } from "@/data/mock-interview";
import type { InterviewState } from "@/types/interview";

export default function QuizPage() {
	const [state, setState] = useState<InterviewState>(createMockInterviewState);

	function updateInterviewState(nextState: InterviewState) {
		setState(appendMockFollowUpIfHelpful(nextState));
	}

	return (
		<main className="page-section min-h-screen">
			<Container as="div" width="interview" className="space-y-8">
				<div className="space-y-4">
					<Link href="/" className="text-sm text-muted hover:text-foreground">
						<span aria-hidden="true">←</span> MediaPulse
					</Link>
					<header className="space-y-2">
						<p className="type-label text-accent">A CONVERSATION ABOUT FILM</p>
						<h1 className="text-3xl sm:text-4xl">Find your movie taste</h1>
						<p className="max-w-2xl text-sm text-muted sm:text-base">
							Share what draws you to a film. This local preview adapts with follow-up
							questions when your answers suggest there is more to explore.
						</p>
					</header>
				</div>
				<InterviewContainer state={state} onStateChange={updateInterviewState} />
			</Container>
		</main>
	);
}
