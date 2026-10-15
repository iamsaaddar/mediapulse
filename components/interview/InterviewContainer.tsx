"use client";

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
	onRetryRecommendations: () => void;
	onRetake: () => void;
}

export function InterviewContainer({
	state,
	isPending,
	errorMessage,
	onStateChange,
	onSubmit,
	onRetry,
	onRetryRecommendations,
	onRetake,
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
		<section
			className="interview-shell mx-auto w-full max-w-3xl"
			role="group"
			aria-label={isCompleted ? "Interview completion" : "Interview"}
			aria-busy={isPending || undefined}
		>
			{isCompleted ? (
				<InterviewCompletion
					personality={state.personality!}
					tasteProfile={state.tasteProfile}
					recommendation={state.recommendation}
					onRetryRecommendations={onRetryRecommendations}
					onRetake={onRetake}
				/>
			) : question ? (
				<div className="interview-shell__content">
					<ProgressIndicator
						currentQuestion={state.currentQuestion}
						questions={questions}
						answeredCount={state.questionCount}
					/>
					<div key={question.id} className="interview-question motion-question-enter">
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
				<p className="interview-waiting" role="status" aria-live="polite">
					{state.questionCount === 0 ? "Setting the scene…" : "Finding your next question…"}
				</p>
			) : (
				<div className="interview-error">
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
		</section>
	);
}
