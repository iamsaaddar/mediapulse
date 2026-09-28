import { INTERVIEW_CONFIG } from "@/config/interview";
import { validateInterviewAnswer } from "@/lib/interview-answer";
import type { InterviewQuestion, InterviewState } from "@/types/interview";

export interface InterviewLimitStatus {
	questionCount: number;
	answeredQuestionCount: number;
	hasReachedMinimum: boolean;
	hasReachedMaximum: boolean;
	canAddQuestion: boolean;
	canComplete: boolean;
}

export function getAvailableInterviewQuestions(
	questions: InterviewState["questions"],
): InterviewState["questions"] {
	return questions.slice(0, INTERVIEW_CONFIG.maxQuestions);
}

export function appendInterviewQuestion(
	state: InterviewState,
	question: InterviewQuestion,
): InterviewState {
	if (
		state.status === "completed" ||
		state.status === "analyzing" ||
		state.status === "analysis_ready" ||
		state.questions.length >= INTERVIEW_CONFIG.maxQuestions ||
		state.questionCount >= INTERVIEW_CONFIG.maxQuestions ||
		state.questions.some((existingQuestion) => existingQuestion.id === question.id)
	) {
		return state;
	}

	const questions = [...state.questions, question];

	return {
		...state,
		questionCount: questions.length,
		questions,
		currentQuestion: state.currentQuestion ?? question.id,
	};
}

export function getInterviewLimitStatus(
	state: InterviewState,
): InterviewLimitStatus {
	const questions = getAvailableInterviewQuestions(state.questions);
	const validations = questions.map((question) => {
		const validation = validateInterviewAnswer(question, state.answers[question.id]);
		return { question, validation };
	});
	const answeredQuestionCount = validations.filter(
		({ validation }) => validation.isValid && validation.hasAnswer,
	).length;
	const requiredQuestionsAreValid = validations.every(
		({ question, validation }) => !question.required || validation.isValid,
	);
	const questionCount = questions.length;
	const hasReachedMinimum = answeredQuestionCount >= INTERVIEW_CONFIG.minQuestions;
	const hasReachedMaximum = questionCount >= INTERVIEW_CONFIG.maxQuestions;

	return {
		questionCount,
		answeredQuestionCount,
		hasReachedMinimum,
		hasReachedMaximum,
		canAddQuestion: questionCount < INTERVIEW_CONFIG.maxQuestions,
		canComplete:
			hasReachedMinimum &&
			requiredQuestionsAreValid &&
			state.questions.length <= INTERVIEW_CONFIG.maxQuestions,
	};
}
