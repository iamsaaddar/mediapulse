"use client";

import { useMemo, useRef, useState } from "react";

import { InterviewCompletion } from "@/components/interview/InterviewCompletion";
import { InterviewContainer } from "@/components/interview/InterviewContainer";
import { PreferenceSetup } from "@/components/interview/PreferenceSetup";
import { MAX_QUESTIONS, MIN_QUESTIONS } from "@/constants/limits";
import { InterviewApiError, requestInterview } from "@/lib/interview-api";
import { validateInterviewAnswer } from "@/lib/interview-answer";
import { createRecommendationRequest } from "@/lib/recommendation-api";
import { createRecommendationHandoff } from "@/lib/recommendation-handoff";
import { requestMovieVibes, VibesApiError } from "@/lib/vibes-api";
import type { PreferenceSelection } from "@/schemas/preferences";
import type { VibeKeyword } from "@/schemas/vibes";
import { createInitialInterviewState } from "@/types/interview";
import type { InterviewAnswer, InterviewRequest, InterviewState } from "@/types/interview";
import type { RecommendationRequest } from "@/types/recommendation";

function vibeDimension(category: VibeKeyword["category"]): InterviewState["tasteProfile"]["signals"][number]["dimension"] {
	switch (category) {
		case "atmosphere": return "tone";
		case "emotion": return "emotion";
		case "micro_genre": return "genre";
		case "trope": return "themes";
		case "pacing": return "pacing";
		case "visual_style": return "visual_style";
	}
}

export default function QuizPage() {
	const [state, setState] = useState<InterviewState>(createInitialInterviewState);
	const [movieTitle, setMovieTitle] = useState("");
	const [vibeResponse, setVibeResponse] = useState<Awaited<ReturnType<typeof requestMovieVibes>> | null>(null);
	const [selectedVibes, setSelectedVibes] = useState<VibeKeyword[]>([]);
	const [selectedDecades, setSelectedDecades] = useState<number[]>([]);
	const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
	const [hasStarted, setHasStarted] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const pendingRef = useRef(false);
	const completedRecommendationRequestRef = useRef<RecommendationRequest | null>(null);
	const recommendationHandoff = useMemo(
		() => createRecommendationHandoff((recommendation) => setState((current) => ({ ...current, recommendation }))),
		[],
	);

	function getPreferences(): PreferenceSelection {
		return {
			anchorMovie: movieTitle.trim(),
			vibes: selectedVibes,
			decades: selectedDecades,
			languages: selectedLanguages,
		};
	}

	async function extractVibes() {
		if (isPending || !movieTitle.trim()) return;
		setIsPending(true);
		setErrorMessage(null);
		try {
			const response = await requestMovieVibes({ movieTitle: movieTitle.trim() });
			setVibeResponse(response);
			setMovieTitle(response.movieTitle);
			setSelectedVibes([]);
		} catch (error) {
			setErrorMessage(error instanceof VibesApiError ? error.message : "The vibe service is temporarily unavailable. Please try again.");
		} finally {
			setIsPending(false);
		}
	}

	async function sendRequest(request: InterviewRequest, requestingFirstTurn: boolean, answer: InterviewAnswer | null) {
		if (pendingRef.current) return;
		pendingRef.current = true;
		setIsPending(true);
		setErrorMessage(null);
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
			const preferences = request.preferences;
			const recommendationRequest = result.status === "complete"
				? createRecommendationRequest(result, preferences)
				: null;
			if (recommendationRequest) completedRecommendationRequestRef.current = recommendationRequest;

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
						preferences,
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
					preferences,
					status: "active",
				};
			});
			if (recommendationRequest) void recommendationHandoff.submit(recommendationRequest);
		} catch (error) {
			setErrorMessage(error instanceof InterviewApiError ? error.message : "The interview service is temporarily unavailable. Please try again.");
		} finally {
			pendingRef.current = false;
			setIsPending(false);
		}
	}

	function startInterview() {
		const preferences = getPreferences();
		if (!vibeResponse || preferences.vibes.length === 0) return;
		completedRecommendationRequestRef.current = null;
		recommendationHandoff.reset();
		const tasteProfile = {
			signals: selectedVibes.map((vibe) => ({ dimension: vibeDimension(vibe.category), value: vibe.tag, confidence: 0.98 })),
			likes: selectedVibes.map(({ tag }) => tag),
			dislikes: [],
		};
		setState({ ...createInitialInterviewState(), preferences, tasteProfile, status: "active" });
		setHasStarted(true);
		void sendRequest({ questionCount: 0, tasteProfile, preferences, lastInteraction: null }, true, null);
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
		setVibeResponse(null);
		setSelectedVibes([]);
		setSelectedDecades([]);
		setSelectedLanguages([]);
		setMovieTitle("");
		setState(createInitialInterviewState());
	}

	function submitAnswer() {
		const question = state.questions.find((item) => item.id === state.currentQuestion);
		if (!question || !state.preferences) return;
		const answer: InterviewAnswer | undefined = state.answers[question.id] ?? (!question.required
			? question.type === "multi_choice"
				? { questionId: question.id, type: question.type, value: [] }
				: { questionId: question.id, type: question.type, value: "" }
			: undefined);
		if (!answer || !validateInterviewAnswer(question, answer).isValid) return;
		void sendRequest({
			questionCount: state.questionCount + 1,
			tasteProfile: state.tasteProfile,
			preferences: state.preferences,
			lastInteraction: {
				question,
				answer: answer.type === "multi_choice" && answer.value.length === 0 ? "" : answer.value,
			},
		}, false, answer);
	}

	function toggleDecade(decade: number) {
		setSelectedDecades((current) => current.includes(decade) ? current.filter((item) => item !== decade) : [...current, decade].sort());
	}

	function toggleLanguage(language: string) {
		setSelectedLanguages((current) => current.includes(language) ? current.filter((item) => item !== language) : [...current, language]);
	}

	function toggleVibe(vibe: VibeKeyword) {
		setSelectedVibes((current) => current.some((item) => item.tag === vibe.tag)
			? current.filter((item) => item.tag !== vibe.tag)
			: [...current, vibe]);
	}

	function resetVibes() {
		setVibeResponse(null);
		setSelectedVibes([]);
		setErrorMessage(null);
	}

	if (state.status === "completed" && state.personality) {
		return <InterviewCompletion personality={state.personality} recommendation={state.recommendation} onRetryRecommendations={retryRecommendations} onRetake={retakeQuiz} />;
	}

	return (
		<main className={`theater-experience${hasStarted ? " theater-experience--seated" : ""}`}>
			<div className="theater-room">
				<section className="theater-screen-frame" aria-label="Cinema screen">
					<div className="theater-screen">
						{hasStarted ? (
							<InterviewContainer
								state={state}
								isPending={isPending}
								errorMessage={errorMessage}
								onStateChange={setState}
								onSubmit={submitAnswer}
								onRetry={state.questions.length === 0 ? startInterview : submitAnswer}
							/>
						) : (
							<PreferenceSetup
								movieTitle={movieTitle}
								onMovieTitleChange={setMovieTitle}
								vibes={vibeResponse}
								selectedVibes={selectedVibes}
								selectedDecades={selectedDecades}
								selectedLanguages={selectedLanguages}
								isPending={isPending}
								errorMessage={errorMessage}
								onExtract={extractVibes}
								onStartInterview={startInterview}
								onToggleVibe={toggleVibe}
								onToggleDecade={toggleDecade}
								onToggleLanguage={toggleLanguage}
								onResetVibes={resetVibes}
							/>
						)}
					</div>
				</section>
				<div className="theater-seat-area" aria-hidden="true">
					<div className="theater-seat theater-seat--stationary">
						<svg viewBox="0 0 240 250" focusable="false">
							<path d="M56 35 Q56 18 75 18 H165 Q184 18 184 35 V136 Q184 153 168 153 H72 Q56 153 56 136 Z" fill="#702237" stroke="#c39a62" strokeWidth="5" />
							<path d="M42 128 Q42 117 54 117 H186 Q198 117 198 129 V166 Q198 178 185 178 H55 Q42 178 42 166 Z" fill="#702237" stroke="#c39a62" strokeWidth="5" />
							<path d="M35 117 Q21 117 21 133 V170 Q21 184 36 184 H48 V144 Q48 132 58 132 H182 Q192 132 192 144 V184 H204 Q219 184 219 170 V133 Q219 117 205 117 H191 V132 H49 V117 Z" fill="#702237" stroke="#c39a62" strokeWidth="4" />
						</svg>
						<span className="theater-seat__label">YOUR STORY</span>
					</div>
				</div>
				<div className="theater-room__floor" aria-hidden="true" />
			</div>
		</main>
	);
}
