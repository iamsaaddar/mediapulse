import { MAX_QUESTIONS, MIN_QUESTIONS } from "@/constants/limits";

export const INTERVIEW_CONFIG = {
  minQuestions: MIN_QUESTIONS,
  maxQuestions: MAX_QUESTIONS,
} as const;
