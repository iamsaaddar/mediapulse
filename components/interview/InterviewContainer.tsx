"use client";

import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { getAvailableInterviewQuestions } from "@/lib/interview-limits";
import type { InterviewState } from "@/types/interview";

import { InterviewCompletion } from "./InterviewCompletion";
import { InterviewNavigation } from "./InterviewNavigation";
import { ProgressIndicator } from "./ProgressIndicator";
import { QuestionRenderer } from "./QuestionRenderer";

interface InterviewContainerProps {
	state: InterviewState;
	isPending: boolean;
	errorMessage: string | null;
	onStateChange: (state: InterviewState) => void;
	onSubmit: () => void;
	onRetry: () => void;
}

export function InterviewContainer({
	state,
	isPending,
	errorMessage,
	onStateChange,
	onSubmit,
	onRetry,
}: InterviewContainerProps) {
	const questions = getAvailableInterviewQuestions(state.questions);
	const question = questions.find(
		(candidate) => candidate.id === state.currentQuestion,
	);
	const answer = question ? state.answers[question.id] : undefined;
	const isCompleted = state.status === "completed" && !!state.personality;

	function handleAnswerChange(nextAnswer: NonNullable<typeof answer>) {
		if (!question) return;

		onStateChange({
			...state,
			answers: {
				...state.answers,
				[nextAnswer.questionId]: nextAnswer,
			},
			recentInteraction: {
				questionId: question.id,
				question,
				answer: nextAnswer,
				occurredAt: new Date().toISOString(),
			},
		});
	}

	return (
		<Card
			variant="elevated"
			className="mx-auto w-full max-w-2xl p-6 sm:p-8"
			role="group"
			aria-label={isCompleted ? "Interview completion" : "Interview"}
		>
			{isCompleted ? (
				<InterviewCompletion personality={state.personality!} />
			) : question ? (
				<div className="space-y-6">
					<ProgressIndicator
						currentQuestion={state.currentQuestion}
						questions={questions}
						answeredCount={state.questionCount}
					/>
					<div key={question.id} className="motion-question-enter">
						<QuestionRenderer
							question={question}
							answer={answer}
							disabled={isPending}
							onAnswerChange={handleAnswerChange}
						/>
					</div>
					<InterviewNavigation
						state={state}
						isPending={isPending}
						onSubmit={onSubmit}
					/>
				</div>
			) : isPending ? (
				<p className="py-8 text-center text-sm text-muted" role="status" aria-live="polite">
					Asking Gemini for your next question…
				</p>
			) : (
				<div className="space-y-4">
					{errorMessage ? (
						<ErrorMessage
							message={errorMessage}
							action={<Button variant="secondary" onClick={onRetry}>Try again</Button>}
						/>
					) : (
						<p className="text-sm text-muted" role="status">
							The interview question is unavailable.
						</p>
					)}
				</div>
			)}
			{question && errorMessage ? (
				<ErrorMessage
					className="mt-5"
					message={errorMessage}
					action={<Button variant="secondary" onClick={onRetry}>Try again</Button>}
				/>
			) : null}
		</Card>
	);
}
