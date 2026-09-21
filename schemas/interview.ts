import { z } from "zod";

import { MAX_QUESTIONS } from "@/constants/limits";

import {
	ConfidenceSchema,
	TasteProfileSchema,
	TasteSignalSchema,
} from "./common";

const SingleChoiceQuestionSchema = z.object({
	type: z.literal("single_choice"),
	text: z.string().min(1),
	options: z.array(z.string().min(1)).min(2),
});

const MultiChoiceQuestionSchema = z.object({
	type: z.literal("multi_choice"),
	text: z.string().min(1),
	options: z.array(z.string().min(1)).min(2),
});

const FreeTextQuestionSchema = z.object({
	type: z.literal("free_text"),
	text: z.string().min(1),
	options: z.array(z.string()).length(0),
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
