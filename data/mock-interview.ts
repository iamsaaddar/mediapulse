import { INTERVIEW_CONFIG } from "@/config/interview";
import { appendInterviewQuestion } from "@/lib/interview-limits";
import { validateInterviewAnswer } from "@/lib/interview-answer";
import type { InterviewAnswer, InterviewQuestion, InterviewState } from "@/types/interview";

const CORE_QUESTIONS = [
	{
		id: "story-style",
		type: "single_choice",
		text: "What kind of story usually draws you in?",
		required: true,
		options: [
			{ id: "character", label: "A close look at memorable characters", value: "character" },
			{ id: "sweeping", label: "A big, immersive journey", value: "sweeping" },
			{ id: "mixed", label: "A story that blends different styles", value: "mixed" },
			{ id: "surprise", label: "Something unexpected", value: "surprise" },
		],
	},
	{
		id: "movie-moods",
		type: "multi_choice",
		text: "Which moods do you often enjoy in a film?",
		required: true,
		options: [
			{ id: "warm", label: "Warm and uplifting", value: "warm" },
			{ id: "tense", label: "Tense and suspenseful", value: "tense" },
			{ id: "wistful", label: "Reflective or bittersweet", value: "wistful" },
			{ id: "playful", label: "Playful and funny", value: "playful" },
		],
	},
	{
		id: "lasting-film",
		type: "free_text",
		text: "Name a film that stayed with you, and what you remember about it.",
		required: true,
	},
	{
		id: "story-pace",
		type: "single_choice",
		text: "What pace feels right for the stories you enjoy?",
		required: true,
		options: [
			{ id: "unhurried", label: "Unhurried, with room to linger", value: "unhurried" },
			{ id: "brisk", label: "Brisk and always moving", value: "brisk" },
			{ id: "mixed-pace", label: "A mix, depending on the story", value: "mixed" },
		],
	},
	{
		id: "memorable-details",
		type: "multi_choice",
		text: "What tends to make a movie memorable for you?",
		required: true,
		options: [
			{ id: "performances", label: "The performances", value: "performances" },
			{ id: "images", label: "The images and atmosphere", value: "images" },
			{ id: "ideas", label: "The ideas it leaves you with", value: "ideas" },
			{ id: "music", label: "The music and sound", value: "music" },
			{ id: "ending", label: "The way it ends", value: "ending" },
		],
	},
] satisfies InterviewQuestion[];

const FOLLOW_UP_QUESTIONS = [
	{
		id: "emotional-balance",
		type: "single_choice",
		text: "How do you like a film to balance emotion and surprise?",
		required: true,
		options: [
			{ id: "grounded", label: "Keep it grounded and clear", value: "grounded" },
			{ id: "mixed-balance", label: "Let it be emotionally complicated", value: "mixed" },
			{ id: "unsure-balance", label: "It depends on the film", value: "unsure" },
		],
	},
	{
		id: "ending-preference",
		type: "multi_choice",
		text: "Which kinds of endings tend to satisfy you?",
		required: true,
		options: [
			{ id: "resolved", label: "A clear resolution", value: "resolved" },
			{ id: "open", label: "An open question to think about", value: "open" },
			{ id: "bittersweet", label: "Something bittersweet", value: "bittersweet" },
			{ id: "surprising-end", label: "A genuine surprise", value: "surprising" },
		],
	},
	{
		id: "returning-themes",
		type: "free_text",
		text: "What themes or kinds of characters do you find yourself returning to?",
		required: false,
	},
	{
		id: "cinematic-worlds",
		type: "multi_choice",
		text: "Which worlds would you like to spend more time in?",
		required: true,
		options: [
			{ id: "realistic", label: "Recognizable everyday life", value: "realistic" },
			{ id: "historical", label: "Another time in history", value: "historical" },
			{ id: "fantastical", label: "A fantastical or imagined place", value: "fantastical" },
			{ id: "faraway", label: "A place I have never seen", value: "faraway" },
		],
	},
	{
		id: "takeaway",
		type: "free_text",
		text: "What would you like your next film to leave you thinking or feeling?",
		required: true,
	},
] satisfies InterviewQuestion[];

export function createMockInterviewState(): InterviewState {
	return {
		questionCount: CORE_QUESTIONS.length,
		questions: [...CORE_QUESTIONS],
		answers: {},
		currentQuestion: CORE_QUESTIONS[0]?.id ?? null,
		tasteProfile: { signals: [], likes: [], dislikes: [] },
		recentInteraction: null,
		status: "active",
	};
}

function answerSuggestsMoreContext(answer: InterviewAnswer): boolean {
	switch (answer.type) {
		case "single_choice":
			return answer.value === "mixed" || answer.value === "unsure";
		case "multi_choice":
			return answer.value.length >= 3;
		case "free_text": {
			const length = answer.value.trim().length;
			return length > 0 && (length < 30 || length >= 80);
		}
	}
}

/** Adds at most one deterministic follow-up when the latest answer suggests nuance. */
export function appendMockFollowUpIfHelpful(state: InterviewState): InterviewState {
	const lastQuestion = state.questions.at(-1);
	if (!lastQuestion || state.currentQuestion !== lastQuestion.id) return state;
	if (state.questions.length < INTERVIEW_CONFIG.minQuestions) return state;
	if (state.questions.length >= INTERVIEW_CONFIG.maxQuestions) return state;

	const answer = state.answers[lastQuestion.id];
	if (!answer || !validateInterviewAnswer(lastQuestion, answer).isValid) return state;
	if (!answerSuggestsMoreContext(answer)) return state;

	const followUpIndex = state.questions.length - INTERVIEW_CONFIG.minQuestions;
	const nextQuestion = FOLLOW_UP_QUESTIONS[followUpIndex];
	return nextQuestion ? appendInterviewQuestion(state, nextQuestion) : state;
}
