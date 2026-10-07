import { z } from "zod";

import {
	MAX_INTERVIEW_ID_LENGTH,
	MAX_INTERVIEW_OPTIONS,
	MAX_INTERVIEW_OPTION_LABEL_LENGTH,
	MAX_INTERVIEW_OPTION_VALUE_LENGTH,
	MAX_INTERVIEW_QUESTION_LENGTH,
	MAX_PERSONALITY_DESCRIPTION_LENGTH,
	MAX_PERSONALITY_TITLE_LENGTH,
	MAX_QUESTIONS,
	MAX_TASTE_LIST_ITEMS,
	MAX_TASTE_LIST_ITEM_LENGTH,
	MAX_TASTE_SIGNALS,
} from "@/constants/limits";

import {
	ConfidenceSchema,
	boundedNonBlankText,
	TasteProfileSchema,
	TasteSignalSchema,
} from "./common";

export const InterviewOptionSchema = z.object({
	id: boundedNonBlankText(MAX_INTERVIEW_ID_LENGTH),
	label: boundedNonBlankText(MAX_INTERVIEW_OPTION_LABEL_LENGTH),
	value: boundedNonBlankText(MAX_INTERVIEW_OPTION_VALUE_LENGTH),
}).strict();

const QuestionBaseSchema = z.object({
	id: boundedNonBlankText(MAX_INTERVIEW_ID_LENGTH),
	text: boundedNonBlankText(MAX_INTERVIEW_QUESTION_LENGTH),
	required: z.boolean(),
});

export const SingleChoiceQuestionSchema = QuestionBaseSchema.extend({
	type: z.literal("single_choice"),
	options: z.array(InterviewOptionSchema).min(2).max(MAX_INTERVIEW_OPTIONS),
}).strict();

export const MultiChoiceQuestionSchema = QuestionBaseSchema.extend({
	type: z.literal("multi_choice"),
	options: z.array(InterviewOptionSchema).min(2).max(MAX_INTERVIEW_OPTIONS),
}).strict();

export const FreeTextQuestionSchema = QuestionBaseSchema.extend({
	type: z.literal("free_text"),
}).strict();

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

export const InterviewRequestSchema = z
	.object({
		questionCount: z
			.number()
			.int()
			.min(0)
			.max(MAX_QUESTIONS),
		tasteProfile: TasteProfileSchema,
		lastInteraction: LastInteractionSchema.nullable(),
	})
	.superRefine((request, context) => {
		if (request.questionCount === 0 && request.lastInteraction !== null) {
			context.addIssue({
				code: "custom",
				path: ["lastInteraction"],
				message: "The first interview turn must not include an interaction.",
			});
		}

		if (request.questionCount > 0 && request.lastInteraction === null) {
			context.addIssue({
				code: "custom",
				path: ["lastInteraction"],
				message: "Subsequent interview turns must include the latest interaction.",
			});
		}
	});

export const TasteUpdateSchema = z.object({
	signals: z.array(TasteSignalSchema.strict()).max(MAX_TASTE_SIGNALS),
	likes: z.array(boundedNonBlankText(MAX_TASTE_LIST_ITEM_LENGTH)).max(MAX_TASTE_LIST_ITEMS),
	dislikes: z.array(boundedNonBlankText(MAX_TASTE_LIST_ITEM_LENGTH)).max(MAX_TASTE_LIST_ITEMS),
}).strict();

export const InterviewPersonalitySchema = z.object({
	title: boundedNonBlankText(MAX_PERSONALITY_TITLE_LENGTH),
	description: boundedNonBlankText(MAX_PERSONALITY_DESCRIPTION_LENGTH),
}).strict();

export type InterviewPersonality = z.infer<typeof InterviewPersonalitySchema>;

const ContinueInterviewResponseSchema = z.object({
	status: z.literal("continue"),
	question: InterviewQuestionSchema,
	tasteUpdate: TasteUpdateSchema,
	confidence: z.object({
		overall: ConfidenceSchema,
	}).strict(),
}).strict();

const CompleteInterviewResponseSchema = z.object({
	status: z.literal("complete"),
	tasteUpdate: TasteUpdateSchema,
	confidence: z.object({
		overall: ConfidenceSchema,
	}).strict(),
	personality: InterviewPersonalitySchema,
}).strict();

export const InterviewResponseSchema = z.discriminatedUnion("status", [
	ContinueInterviewResponseSchema,
	CompleteInterviewResponseSchema,
]);
