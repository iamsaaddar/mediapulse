"use client";

import styles from "./interview.module.css";
import { cxModule } from "@/lib/utils";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { getAvailableInterviewQuestions } from "@/lib/interview-limits";
import type { InterviewState } from "@/types/interview";

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
		<section
			className={cxModule(styles, "interview-shell mx-auto w-full max-w-3xl")}
			role="group"
			aria-label={isCompleted ? "Interview completion" : "Interview"}
			aria-busy={isPending || undefined}
		>
			{question ? (
				<div className={cxModule(styles, "interview-shell__content")}>
					<ProgressIndicator
						currentQuestion={state.currentQuestion}
						questions={questions}
						answeredCount={state.questionCount}
					/>
					<div key={question.id} className={cxModule(styles, "interview-question motion-question-enter")}>
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
				<p className={cxModule(styles, "interview-waiting")} role="status" aria-live="polite">
					{state.questionCount === 0 ? "Setting the scene…" : "Finding your next question…"}
				</p>
			) : (
				<div className={cxModule(styles, "interview-error")}>
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
