export const QUESTION_TYPES = [
	"single_choice",
	"multi_choice",
	"free_text",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
