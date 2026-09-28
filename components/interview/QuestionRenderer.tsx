"use client";

import type { ReactNode } from "react";

import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { validateInterviewAnswer } from "@/lib/interview-answer";
import type { InterviewAnswer, InterviewQuestion } from "@/types/interview";

import { FreeText } from "./FreeText";
import { MultiChoice } from "./MultiChoice";
import { SingleChoice } from "./SingleChoice";

interface QuestionRendererProps {
	question: InterviewQuestion;
	answer?: InterviewAnswer;
	onAnswerChange: (answer: InterviewAnswer) => void;
}

export function QuestionRenderer({
	question,
	answer,
	onAnswerChange,
}: QuestionRendererProps) {
	const feedbackId = `answer-feedback-${question.id}`;
	const validation = validateInterviewAnswer(question, answer);
	let control: ReactNode;

	switch (question.type) {
		case "single_choice":
			control = (
				<SingleChoice
					question={question}
					feedbackId={feedbackId}
					value={
						answer?.type === "single_choice" && answer.questionId === question.id
							? answer.value
							: undefined
					}
					onChange={(value) =>
						onAnswerChange({ questionId: question.id, type: question.type, value })
					}
				/>
			);
			break;
		case "multi_choice":
			control = (
				<MultiChoice
					question={question}
					feedbackId={feedbackId}
					value={
						answer?.type === "multi_choice" && answer.questionId === question.id
							? answer.value
							: undefined
					}
					onChange={(value) =>
						onAnswerChange({ questionId: question.id, type: question.type, value })
					}
				/>
			);
			break;
		case "free_text":
			control = (
				<FreeText
					question={question}
					feedbackId={feedbackId}
					value={
						answer?.type === "free_text" && answer.questionId === question.id
							? answer.value
							: undefined
					}
					onChange={(value) =>
						onAnswerChange({ questionId: question.id, type: question.type, value })
					}
				/>
			);
			break;
		default:
			return (
				<ErrorMessage
					title="Unsupported question"
					message="This question type can’t be displayed yet."
				/>
			);
	}

	return (
		<div className="space-y-4">
			{control}
			<p
				id={feedbackId}
				className={`text-sm ${
					validation.isValid && validation.hasAnswer
						? "text-success"
						: validation.isValid
							? "text-muted"
							: "text-error"
				}`}
			>
				{validation.message}
			</p>
		</div>
	);
}
