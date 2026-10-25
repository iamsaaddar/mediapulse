import styles from "./interview.module.css";
import { cxModule } from "@/lib/utils";
import type { FreeTextQuestion as FreeTextQuestionModel } from "@/types/interview";

interface FreeTextProps {
	question: FreeTextQuestionModel;
	value?: string;
	feedbackId: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export function FreeText({
	question,
	value = "",
	feedbackId,
	onChange,
	disabled = false,
}: FreeTextProps) {
	const inputId = `answer-${question.id}`;

	return (
		<div className={cxModule(styles, "free-text-answer")}>
			<label htmlFor={inputId} className={cxModule(styles, "interview-question__prompt")}>
				{question.text}
			</label>
			<p id={`${question.id}-instruction`} className={cxModule(styles, "interview-question__instruction")}>
				{question.required
						? "A response is required."
						: "Your response is optional."}
			</p>
			<textarea
				id={inputId}
				value={value}
				disabled={disabled}
				required={question.required}
				aria-invalid={question.required && !value.trim() ? true : undefined}
				aria-describedby={`${question.id}-instruction ${feedbackId}`}
				onChange={(event) => onChange(event.target.value)}
				rows={4}
				className={cxModule(styles, "free-text-answer__input")}
			/>
		</div>
	);
}
