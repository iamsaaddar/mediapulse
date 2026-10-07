"use client";

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
		<div className="space-y-3 border-t border-border pt-5">
			<div className="flex justify-end">
				<Button
					disabled={!isAnswerValid || isPending}
					loading={isPending}
					onClick={onSubmit}
				>
					Submit answer
				</Button>
			</div>
		</div>
	);
}
