import type { z } from "zod";

import {
	InterviewRequestSchema,
	InterviewResponseSchema,
	InterviewQuestionSchema,
} from "@/schemas/interview";

export type InterviewRequest = z.infer<typeof InterviewRequestSchema>;
export type InterviewResponse = z.infer<typeof InterviewResponseSchema>;
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
