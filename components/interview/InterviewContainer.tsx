"use client";

import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import {
	getAvailableInterviewQuestions,
	getInterviewLimitStatus,
} from "@/lib/interview-limits";
import type { InterviewState } from "@/types/interview";

import { InterviewCompletion } from "./InterviewCompletion";
import { InterviewAnalysis } from "./InterviewAnalysis";
import { InterviewNavigation } from "./InterviewNavigation";
import { ProgressIndicator } from "./ProgressIndicator";
import { QuestionRenderer } from "./QuestionRenderer";

interface InterviewContainerProps {
	state: InterviewState;
	onStateChange: (state: InterviewState) => void;
}

export function InterviewContainer({
	state,
	onStateChange,
}: InterviewContainerProps) {
	const questions = getAvailableInterviewQuestions(state.questions);
	const question = questions.find(
		(candidate) => candidate.id === state.currentQuestion,
	);
	const answer = question ? state.answers[question.id] : undefined;
	const canComplete = getInterviewLimitStatus(state).canComplete;
	const isAtAvailableEnd =
		questions.at(-1)?.id === state.currentQuestion && questions.length > 0;
	const isEligibleForNextStage = canComplete && isAtAvailableEnd;
	const isCompleted = state.status === "completed" && isEligibleForNextStage;
	const isAnalyzing =
		state.status === "analyzing" || state.status === "analysis_ready";
	const hasInvalidFinishedStatus =
		(state.status === "completed" || isAnalyzing) && !isEligibleForNextStage;

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
				<InterviewCompletion
					onGenerateRecommendations={() =>
						onStateChange({ ...state, status: "analyzing" })
					}
				/>
			) : isAnalyzing && isEligibleForNextStage ? (
				<InterviewAnalysis
					status={
						state.status === "analysis_ready" ? "analysis_ready" : "analyzing"
					}
					onComplete={() =>
						onStateChange({ ...state, status: "analysis_ready" })
					}
				/>
			) : hasInvalidFinishedStatus ? (
				<ErrorMessage
					title="Interview cannot be completed yet"
					message="Complete at least five valid answers and any required questions before your taste profile is ready."
				/>
			) : question ? (
				<div className="space-y-6">
					<ProgressIndicator
						currentQuestion={state.currentQuestion}
						questions={questions}
					/>
					<div key={question.id} className="motion-question-enter">
						<QuestionRenderer
							question={question}
							answer={answer}
							onAnswerChange={handleAnswerChange}
						/>
					</div>
					<InterviewNavigation state={state} onStateChange={onStateChange} />
				</div>
			) : (
				<p className="text-sm text-muted" role="status">
					{state.currentQuestion
						? "The current question is unavailable."
						: "No question is selected yet."}
				</p>
			)}
		</Card>
	);
}
