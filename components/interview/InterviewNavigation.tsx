"use client";

import { Button } from "@/components/ui/Button";
import { validateInterviewAnswer } from "@/lib/interview-answer";
import {
	getAvailableInterviewQuestions,
	getInterviewLimitStatus,
} from "@/lib/interview-limits";
import type { InterviewState } from "@/types/interview";

interface InterviewNavigationProps {
	state: InterviewState;
	onStateChange: (state: InterviewState) => void;
}

export function InterviewNavigation({
	state,
	onStateChange,
}: InterviewNavigationProps) {
	const questions = getAvailableInterviewQuestions(state.questions);
	const currentIndex = questions.findIndex(
		(question) => question.id === state.currentQuestion,
	);
	const currentQuestion = currentIndex >= 0 ? questions[currentIndex] : undefined;
	const currentAnswer = currentQuestion
		? state.answers[currentQuestion.id]
		: undefined;
	const canMovePrevious = currentIndex > 0;
	const isAtAvailableEnd =
		currentIndex >= 0 && currentIndex === questions.length - 1;
	const mayComplete = getInterviewLimitStatus(state).canComplete;
	const canMoveNext =
		currentQuestion !== undefined &&
		currentIndex < questions.length - 1 &&
		validateInterviewAnswer(currentQuestion, currentAnswer).isValid;
	const canFinish =
		isAtAvailableEnd &&
		mayComplete &&
		currentQuestion !== undefined &&
		validateInterviewAnswer(currentQuestion, currentAnswer).isValid;

	function moveTo(index: number) {
		const nextQuestion = questions[index];
		if (!nextQuestion) return;

		onStateChange({
			...state,
			currentQuestion: nextQuestion.id,
		});
	}

	function finishInterview() {
		if (!canFinish) return;

		onStateChange({
			...state,
			status: "completed",
		});
	}

	return (
		<div className="space-y-3 border-t border-border pt-5">
			<nav
				aria-label="Interview navigation"
				className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"
			>
				<Button
					variant="secondary"
					disabled={!canMovePrevious}
					onClick={() => moveTo(currentIndex - 1)}
				>
					Previous
				</Button>
				<Button
					disabled={!canMoveNext && !canFinish}
					onClick={canFinish ? finishInterview : () => moveTo(currentIndex + 1)}
				>
					{isAtAvailableEnd && mayComplete ? "Finish interview" : "Next"}
				</Button>
			</nav>
			{isAtAvailableEnd && !mayComplete ? (
				<p className="text-right text-sm text-muted" role="status">
					At least five valid answers are needed before the interview can finish.
				</p>
			) : null}
		</div>
	);
}
