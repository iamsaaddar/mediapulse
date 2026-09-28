import type { InterviewAnswer, InterviewQuestion } from "@/types/interview";

export interface InterviewAnswerValidation {
	isValid: boolean;
	hasAnswer: boolean;
	message: string;
}

export function validateInterviewAnswer(
	question: InterviewQuestion,
	answer?: InterviewAnswer,
): InterviewAnswerValidation {
	if (!answer) {
		return {
			isValid: !question.required,
			hasAnswer: false,
			message: question.required
				? question.type === "single_choice"
					? "Select one option to continue."
					: question.type === "multi_choice"
						? "Select at least one option to continue."
						: "Enter a response to continue."
				: "Optional question · you can continue without answering.",
		};
	}

	if (answer.questionId !== question.id) {
		return {
			isValid: false,
			hasAnswer: true,
			message: "This response does not match the current question.",
		};
	}

	switch (question.type) {
		case "single_choice": {
			if (answer.type !== "single_choice") {
				return {
					isValid: false,
					hasAnswer: true,
					message: "This response does not match the current question.",
				};
			}

			const selected = question.options.some(
				(option) => option.value === answer.value,
			);
			return {
				isValid: selected || !question.required,
				hasAnswer: selected,
				message: selected
					? "Your answer is selected."
					: question.required
						? "Select one option to continue."
						: "Optional question · you can continue without answering.",
			};
		}
		case "multi_choice": {
			if (answer.type !== "multi_choice") {
				return {
					isValid: false,
					hasAnswer: true,
					message: "This response does not match the current question.",
				};
			}

			const validOptions = new Set(question.options.map((option) => option.value));
			const selected = answer.value.length > 0;
			const valuesAreValid = answer.value.every((value) => validOptions.has(value));
			return {
				isValid: valuesAreValid && (selected || !question.required),
				hasAnswer: selected,
				message: !valuesAreValid
					? "One or more selected options are unavailable."
					: selected
						? "Your answers are selected."
						: question.required
							? "Select at least one option to continue."
							: "Optional question · you can continue without answering.",
			};
		}
		case "free_text": {
			if (answer.type !== "free_text") {
				return {
					isValid: false,
					hasAnswer: true,
					message: "This response does not match the current question.",
				};
			}

			const hasMeaningfulText = answer.value.trim().length > 0;
			return {
				isValid: hasMeaningfulText || !question.required,
				hasAnswer: hasMeaningfulText,
				message: hasMeaningfulText
					? "Your response is entered."
					: question.required
						? "Enter a response to continue."
						: "Optional question · you can continue without answering.",
			};
		}
		default:
			return {
				isValid: false,
				hasAnswer: true,
				message: "This question type cannot be validated yet.",
			};
	}
}
