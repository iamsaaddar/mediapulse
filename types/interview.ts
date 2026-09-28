import type { z } from "zod";

import type { TasteProfile } from "@/types/taste";
import {
	InterviewRequestSchema,
	InterviewResponseSchema,
	InterviewQuestionSchema,
	InterviewOptionSchema,
	SingleChoiceQuestionSchema,
	MultiChoiceQuestionSchema,
	FreeTextQuestionSchema,
} from "@/schemas/interview";

export type InterviewRequest = z.infer<typeof InterviewRequestSchema>;
export type InterviewResponse = z.infer<typeof InterviewResponseSchema>;
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type InterviewOption = z.infer<typeof InterviewOptionSchema>;
export type SingleChoiceQuestion = z.infer<typeof SingleChoiceQuestionSchema>;
export type MultiChoiceQuestion = z.infer<typeof MultiChoiceQuestionSchema>;
export type FreeTextQuestion = z.infer<typeof FreeTextQuestionSchema>;

/** Alias retained for the adaptive interview state model. */
export type InterviewStateQuestion = InterviewQuestion;

export type InterviewAnswer =
	| { questionId: string; type: "single_choice"; value: string }
	| { questionId: string; type: "multi_choice"; value: string[] }
	| { questionId: string; type: "free_text"; value: string };

export type InterviewStatus =
	| "idle"
	| "active"
	| "completed"
	| "analyzing"
	| "analysis_ready";

export interface InterviewInteraction {
	questionId: string;
	question: InterviewQuestion;
	answer: InterviewAnswer;
	occurredAt: string;
}

/** UI state for a dynamically sized, one-question-at-a-time interview. */
export interface InterviewState {
	questionCount: number;
	questions: InterviewStateQuestion[];
	answers: Record<string, InterviewAnswer>;
	currentQuestion: string | null;
	tasteProfile: TasteProfile;
	recentInteraction: InterviewInteraction | null;
	status: InterviewStatus;
}

export function createInitialInterviewState(): InterviewState {
	return {
		questionCount: 0,
		questions: [],
		answers: {},
		currentQuestion: null,
		tasteProfile: { signals: [], likes: [], dislikes: [] },
		recentInteraction: null,
		status: "idle",
	};
}
