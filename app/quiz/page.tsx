"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { InterviewContainer } from "@/components/interview/InterviewContainer";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { MAX_QUESTIONS, MIN_QUESTIONS } from "@/constants/limits";
import { InterviewApiError, requestInterview } from "@/lib/interview-api";
import { validateInterviewAnswer } from "@/lib/interview-answer";
import { createInitialInterviewState } from "@/types/interview";
import type { InterviewAnswer, InterviewRequest, InterviewState } from "@/types/interview";

export default function QuizPage() {
	const [state, setState] = useState<InterviewState>(createInitialInterviewState);
	const [hasStarted, setHasStarted] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const pendingRef = useRef(false);

	async function sendRequest(
		request: InterviewRequest,
		requestingFirstTurn: boolean,
		answer: InterviewAnswer | null,
	) {
		if (pendingRef.current) return;
		pendingRef.current = true;
		setIsPending(true);
		setErrorMessage(null);
		setHasStarted(true);

		try {
			const result = await requestInterview(request);
			if (requestingFirstTurn && result.status !== "continue") {
				throw new InterviewApiError("The interview could not be started. Please try again.");
			}
			if (result.status === "complete" && request.questionCount < MIN_QUESTIONS) {
				throw new InterviewApiError("The interview returned an invalid completion. Please try again.");
			}
			if (result.status === "continue" && request.questionCount >= MAX_QUESTIONS) {
				throw new InterviewApiError("The interview reached its question limit without completing.");
			}
			if (result.status === "continue" && state.questions.some((question) => question.id === result.question.id)) {
				throw new InterviewApiError("The interview returned a repeated question. Please try again.");
			}

			setState((current) => {
				const interaction = answer && current.currentQuestion
					? {
						questionId: current.currentQuestion,
						question: current.questions.find((question) => question.id === current.currentQuestion)!,
						answer,
						occurredAt: new Date().toISOString(),
					}
					: current.recentInteraction;

				if (result.status === "complete") {
					return {
						...current,
						questionCount: request.questionCount,
						tasteProfile: result.tasteUpdate,
						recentInteraction: interaction,
						personality: result.personality,
						status: "completed",
					};
				}

				return {
					...current,
					questionCount: request.questionCount,
					questions: [...current.questions, result.question],
					currentQuestion: result.question.id,
					tasteProfile: result.tasteUpdate,
					recentInteraction: interaction,
					status: "active",
				};
			});
		} catch (error) {
			setErrorMessage(
				error instanceof InterviewApiError
					? error.message
					: "The interview service is temporarily unavailable. Please try again.",
			);
		} finally {
			pendingRef.current = false;
			setIsPending(false);
		}
	}

	function startInterview() {
		void sendRequest(
			{
				questionCount: 0,
				tasteProfile: { signals: [], likes: [], dislikes: [] },
				lastInteraction: null,
			},
			true,
			null,
		);
	}

	function submitAnswer() {
		const question = state.questions.find((item) => item.id === state.currentQuestion);
		if (!question) return;
		const answer: InterviewAnswer | undefined =
			state.answers[question.id] ??
			(!question.required
				? question.type === "multi_choice"
					? { questionId: question.id, type: question.type, value: [] }
					: question.type === "free_text"
						? { questionId: question.id, type: question.type, value: "" }
						: { questionId: question.id, type: question.type, value: "" }
				: undefined);
		if (!answer || !validateInterviewAnswer(question, answer).isValid) return;

		void sendRequest(
			{
				questionCount: state.questionCount + 1,
				tasteProfile: state.tasteProfile,
				lastInteraction: {
					question,
					answer:
						answer.type === "multi_choice" && answer.value.length === 0
							? ""
							: answer.value,
				},
			},
			false,
			answer,
		);
	}

	function updateInterviewState(nextState: InterviewState) {
		setState(nextState);
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
							Share what draws you to a film. Gemini will adapt each next question to
							what you have told us.
						</p>
					</header>
				</div>
				{!hasStarted ? (
					<div className="space-y-4">
						{errorMessage ? <ErrorMessage message={errorMessage} /> : null}
						<Button onClick={startInterview} loading={isPending}>
							Start interview
						</Button>
					</div>
				) : (
					<InterviewContainer
						state={state}
						isPending={isPending}
						errorMessage={errorMessage}
						onStateChange={updateInterviewState}
						onSubmit={submitAnswer}
						onRetry={state.questions.length === 0 ? startInterview : submitAnswer}
					/>
				)}
			</Container>
		</main>
	);
}
