"use client";

import styles from "@/components/results/results.module.css";
import { cxModule } from "@/lib/utils";
import Image from "next/image";
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
		<main className={cxModule(styles, "results-page")}>
			<Image className={cxModule(styles, "results-page__backdrop")} src="/images/mediapulse/recommendation-page.jpg" alt="" fill priority sizes="100vw" />
			<section
				className={cxModule(styles, "interview-completion motion-result-reveal")}
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
