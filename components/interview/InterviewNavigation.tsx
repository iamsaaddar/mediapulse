"use client";

import styles from "./interview.module.css";
import { cxModule } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { validateInterviewAnswer } from "@/lib/interview-answer";
import { getAvailableInterviewQuestions } from "@/lib/interview-limits";
import type { InterviewState } from "@/types/interview";

interface InterviewNavigationProps {
	state: InterviewState;
	isPending: boolean;
	onSubmit: () => void;
}

export function InterviewNavigation({
	state,
	isPending,
	onSubmit,
}: InterviewNavigationProps) {
	const questions = getAvailableInterviewQuestions(state.questions);
	const currentQuestion = questions.find(
		(question) => question.id === state.currentQuestion,
	);
	const currentAnswer = currentQuestion
		? state.answers[currentQuestion.id]
		: undefined;
	const isAnswerValid =
		currentQuestion !== undefined &&
		validateInterviewAnswer(currentQuestion, currentAnswer).isValid;

	return (
		<div className={cxModule(styles, "interview-navigation")}>
			<p>Each answer helps shape your next question.</p>
			<div className="flex justify-end">
				<Button
					disabled={!isAnswerValid || isPending}
					loading={isPending}
					onClick={onSubmit}
				>
					Continue <span aria-hidden="true">→</span>
				</Button>
			</div>
		</div>
	);
}
