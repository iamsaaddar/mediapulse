"use client";

import { useMemo, useRef, useState } from "react";

import { InterviewContainer } from "@/components/interview/InterviewContainer";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { MAX_QUESTIONS, MIN_QUESTIONS } from "@/constants/limits";
import { InterviewApiError, requestInterview } from "@/lib/interview-api";
import { validateInterviewAnswer } from "@/lib/interview-answer";
import { createRecommendationRequest } from "@/lib/recommendation-api";
import { createRecommendationHandoff } from "@/lib/recommendation-handoff";
import { createInitialInterviewState } from "@/types/interview";
import type { InterviewAnswer, InterviewRequest, InterviewState } from "@/types/interview";
import type { RecommendationRequest } from "@/types/recommendation";

export default function QuizPage() {
	const [state, setState] = useState<InterviewState>(createInitialInterviewState);
	const [hasStarted, setHasStarted] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const pendingRef = useRef(false);
	const completedRecommendationRequestRef = useRef<RecommendationRequest | null>(null);
	const recommendationHandoff = useMemo(
		() =>
			createRecommendationHandoff((recommendation) => {
				setState((current) => ({ ...current, recommendation }));
			}),
		[],
	);

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
			const recommendationRequest =
				result.status === "complete"
					? createRecommendationRequest(result)
					: null;
			if (recommendationRequest) {
				completedRecommendationRequestRef.current = recommendationRequest;
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
						confidence: result.confidence,
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
			if (recommendationRequest) {
				void recommendationHandoff.submit(recommendationRequest);
			}
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
		completedRecommendationRequestRef.current = null;
		recommendationHandoff.reset();
		setState(createInitialInterviewState());
		setErrorMessage(null);
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

	function retryRecommendations() {
		const request = completedRecommendationRequestRef.current;
		if (request) {
			setErrorMessage(null);
			void recommendationHandoff.submit(request, true);
		}
	}

	function retakeQuiz() {
		completedRecommendationRequestRef.current = null;
		recommendationHandoff.reset();
		setErrorMessage(null);
		setHasStarted(false);
		setState(createInitialInterviewState());
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
		<main className="discovery-page">
			<Container as="div" width="interview" className="discovery-page__content">
				<div className="discovery-page__intro">
					<p className="type-label text-accent">Let&apos;s find your next film</p>
					<h1>Every favorite has a story.</h1>
					<p>
						Start with one movie that means something to you. We&apos;ll follow
						your answers toward the next one.
					</p>
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
						onRetryRecommendations={retryRecommendations}
						onRetake={retakeQuiz}
					/>
				)}
			</Container>
		</main>
	);
}
