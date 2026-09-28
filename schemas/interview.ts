import { z } from "zod";

import { MAX_QUESTIONS } from "@/constants/limits";

import {
	ConfidenceSchema,
	TasteProfileSchema,
	TasteSignalSchema,
} from "./common";

export const InterviewOptionSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	value: z.string().min(1),
});

const QuestionBaseSchema = z.object({
	id: z.string().min(1),
	text: z.string().min(1),
	required: z.boolean(),
});

export const SingleChoiceQuestionSchema = QuestionBaseSchema.extend({
	type: z.literal("single_choice"),
	options: z.array(InterviewOptionSchema).min(2),
});

export const MultiChoiceQuestionSchema = QuestionBaseSchema.extend({
	type: z.literal("multi_choice"),
	options: z.array(InterviewOptionSchema).min(2),
});

export const FreeTextQuestionSchema = QuestionBaseSchema.extend({
	type: z.literal("free_text"),
});

export const InterviewQuestionSchema = z.discriminatedUnion("type", [
	SingleChoiceQuestionSchema,
	MultiChoiceQuestionSchema,
	FreeTextQuestionSchema,
]);

export const LastInteractionSchema = z.object({
	question: InterviewQuestionSchema,
	answer: z.union([
		z.string(),
		z.array(z.string().min(1)),
	]),
});

export const InterviewRequestSchema = z.object({
	questionCount: z
		.number()
		.int()
		.min(0)
		.max(MAX_QUESTIONS),
	tasteProfile: TasteProfileSchema,
	lastInteraction: LastInteractionSchema.nullable(),
});

export const TasteUpdateSchema = z.object({
	signals: z.array(TasteSignalSchema),
	likes: z.array(z.string().min(1)),
	dislikes: z.array(z.string().min(1)),
});

const ContinueInterviewResponseSchema = z.object({
	status: z.literal("continue"),
	question: InterviewQuestionSchema,
	tasteUpdate: TasteUpdateSchema,
	confidence: z.object({
		overall: ConfidenceSchema,
	}),
});

const CompleteInterviewResponseSchema = z.object({
	status: z.literal("complete"),
	tasteUpdate: TasteUpdateSchema,
	confidence: z.object({
		overall: ConfidenceSchema,
	}),
});

export const InterviewResponseSchema = z.discriminatedUnion("status", [
	ContinueInterviewResponseSchema,
	CompleteInterviewResponseSchema,
]);
