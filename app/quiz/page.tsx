"use client";

import { useMemo, useRef, useState } from "react";

import { InterviewCompletion } from "@/components/interview/InterviewCompletion";
import { InterviewContainer } from "@/components/interview/InterviewContainer";
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

	return state.status === "completed" && state.personality ? (
		<InterviewCompletion
			personality={state.personality}
			recommendation={state.recommendation}
			onRetryRecommendations={retryRecommendations}
			onRetake={retakeQuiz}
		/>
	) : (
		<main className={`theater-experience${hasStarted ? " theater-experience--seated" : ""}`}>
			<div className="theater-room">
				<section className="theater-screen-frame" aria-label="Cinema screen">
					<div className="theater-screen">
						{!hasStarted ? (
							<div className="theater-welcome">
								<p className="theater-screen__eyebrow">MEDIA PULSE PRESENTS</p>
								<h1>
									A story chosen
									<br />
									just for you.
								</h1>
								<span className="theater-screen__divider" aria-hidden="true" />
								<p className="theater-screen__invitation">Take your seat when you&apos;re ready.</p>
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
					</div>
				</section>
				<div className="theater-seat-area">
					<button
						className="theater-seat"
						type="button"
						onClick={startInterview}
						disabled={hasStarted || isPending}
						aria-label={isPending ? "Taking your seat, starting the interview" : hasStarted ? "Your theater seat" : "Take your seat to start the interview"}
					>
						<svg viewBox="0 0 240 250" aria-hidden="true" focusable="false">
							<defs>
								<linearGradient id="seat-velvet" x1="0" x2="1" y1="0" y2="1">
									<stop offset="0" stopColor="#9d354c" />
									<stop offset="0.48" stopColor="#702237" />
									<stop offset="1" stopColor="#401522" />
								</linearGradient>
								<linearGradient id="seat-gold" x1="0" x2="0" y1="0" y2="1">
									<stop offset="0" stopColor="#c39a62" />
									<stop offset="1" stopColor="#72502e" />
								</linearGradient>
							</defs>
							<path d="M56 35 Q56 18 75 18 H165 Q184 18 184 35 V136 Q184 153 168 153 H72 Q56 153 56 136 Z" fill="url(#seat-velvet)" stroke="url(#seat-gold)" strokeWidth="5" />
							<path d="M70 43 Q70 33 82 33 H158 Q170 33 170 43 V124 Q170 136 158 136 H82 Q70 136 70 124 Z" fill="none" stroke="#d79b87" strokeOpacity=".36" strokeWidth="2" />
							<path d="M42 128 Q42 117 54 117 H186 Q198 117 198 129 V166 Q198 178 185 178 H55 Q42 178 42 166 Z" fill="url(#seat-velvet)" stroke="url(#seat-gold)" strokeWidth="5" />
							<path d="M35 117 Q21 117 21 133 V170 Q21 184 36 184 H48 V144 Q48 132 58 132 H182 Q192 132 192 144 V184 H204 Q219 184 219 170 V133 Q219 117 205 117 H191 V132 H49 V117 Z" fill="url(#seat-velvet)" stroke="url(#seat-gold)" strokeWidth="4" />
							<path d="M70 179 L63 226 M170 179 L177 226 M53 227 H74 M166 227 H187" fill="none" stroke="url(#seat-gold)" strokeLinecap="round" strokeWidth="7" />
							<path d="M78 51 V115 M91 43 V121" fill="none" stroke="#e5b3a0" strokeOpacity=".12" strokeWidth="3" />
						</svg>
						<span className="theater-seat__label">
							{isPending ? "PLEASE WAIT" : hasStarted ? "YOUR SEAT" : "TAKE YOUR SEAT"}
						</span>
					</button>
				</div>
				<div className="theater-room__floor" aria-hidden="true" />
			</div>
		</main>
	);
}
