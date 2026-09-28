"use client";

import { useEffect, useRef, useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import type { InterviewStatus } from "@/types/interview";

const ANALYSIS_STAGES = [
	{ id: "preferences", label: "Understanding your preferences" },
	{ id: "personality", label: "Mapping your cinematic personality" },
	{ id: "patterns", label: "Finding your movie patterns" },
	{ id: "recommendations", label: "Preparing your recommendations" },
] as const;

const STAGE_DURATION_MS = 1_100;
type AnalysisStatus = Extract<InterviewStatus, "analyzing" | "analysis_ready">;

interface InterviewAnalysisProps {
	status: AnalysisStatus;
	onComplete: () => void;
}

export function InterviewAnalysis({ status, onComplete }: InterviewAnalysisProps) {
	const alreadyReady = status === "analysis_ready";
	const [activeStage, setActiveStage] = useState(
		alreadyReady ? ANALYSIS_STAGES.length - 1 : 0,
	);
	const [isReady, setIsReady] = useState(alreadyReady);
	const onCompleteRef = useRef(onComplete);
	const currentStage = ANALYSIS_STAGES[activeStage];

	useEffect(() => {
		onCompleteRef.current = onComplete;
	}, [onComplete]);

	useEffect(() => {
		if (isReady) return;

		const timer = window.setTimeout(() => {
			if (activeStage < ANALYSIS_STAGES.length - 1) {
				setActiveStage((stage) => stage + 1);
				return;
			}

			setIsReady(true);
			onCompleteRef.current();
		}, STAGE_DURATION_MS);

		return () => window.clearTimeout(timer);
	}, [activeStage, isReady]);

	return (
		<section
			aria-labelledby="interview-analysis-title"
			className="motion-result-reveal space-y-6 py-4 sm:py-8"
		>
			<header className="space-y-4 text-center">
				{isReady ? (
					<p className="type-label text-success">PREVIEW COMPLETE</p>
				) : (
					<Spinner
						size="lg"
						label={`Analyzing your movie taste: ${currentStage.label}`}
						className="mx-auto"
					/>
				)}
				<h2 id="interview-analysis-title" className="text-3xl sm:text-4xl">
					{isReady ? "Your taste profile is ready" : "Analyzing your movie taste..."}
				</h2>
				<p className="mx-auto max-w-lg text-sm text-muted sm:text-base">
					{isReady
						? "The local preview is complete. No recommendations have been generated yet."
						: "A preview of how your preferences will shape personalized recommendations."}
				</p>
			</header>

			<ol
				aria-label="Analysis stages"
				className="mx-auto max-w-lg space-y-3"
			>
				{ANALYSIS_STAGES.map((stage, index) => {
					const isComplete = isReady || index < activeStage;
					const isCurrent = !isReady && index === activeStage;

					return (
						<li
							key={stage.id}
							aria-current={isCurrent ? "step" : undefined}
							className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors duration-300 ${
								isComplete
									? "border-success/40 bg-success/10 text-foreground"
									: isCurrent
										? "border-accent bg-accent-subtle text-foreground"
										: "border-border bg-surface text-muted"
							}`}
						>
							<span className="w-6 shrink-0 text-center font-semibold" aria-hidden="true">
								{isComplete ? "✓" : isCurrent ? "•" : index + 1}
							</span>
							<span className="min-w-0 flex-1">{stage.label}</span>
							<span className="type-label shrink-0 text-right">
								{isComplete ? "Complete" : isCurrent ? "In progress" : "Upcoming"}
							</span>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
