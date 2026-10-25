import styles from "./interview.module.css";
import { cxModule } from "@/lib/utils";
import type { SingleChoiceQuestion as SingleChoiceQuestionModel } from "@/types/interview";

interface SingleChoiceProps {
	question: SingleChoiceQuestionModel;
	value?: string;
	feedbackId: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export function SingleChoice({
	question,
	value,
	feedbackId,
	onChange,
	disabled = false,
}: SingleChoiceProps) {
	return (
		<fieldset
			className={cxModule(styles, "interview-options")}
			aria-required={question.required || undefined}
			aria-invalid={question.required && !value ? true : undefined}
			aria-describedby={`${question.id}-instruction ${feedbackId}`}
		>
			<legend className={cxModule(styles, "interview-question__prompt")}>{question.text}</legend>
			<p id={`${question.id}-instruction`} className={cxModule(styles, "interview-question__instruction")}>
				Choose one option{question.required ? " · required" : " · optional"}
			</p>
			{question.options.map((option) => {
				const selected = value === option.value;

				return (
					<label
						key={option.id}
						className={cxModule(styles, `interview-option motion-selectable ${
							selected
								? "interview-option--selected"
								: ""
						}`)}
					>
						<input
							type="radio"
							name={question.id}
							value={option.value}
							checked={selected}
							disabled={disabled}
							required={question.required}
							onChange={() => onChange(option.value)}
							className="accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						/>
						<span className={cxModule(styles, "interview-option__label")}>{option.label}</span>
						<span className={cxModule(styles, "interview-option__check")} aria-hidden="true">{selected ? "✓" : ""}</span>
					</label>
				);
			})}
		</fieldset>
	);
}
