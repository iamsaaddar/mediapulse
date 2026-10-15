import type { MultiChoiceQuestion as MultiChoiceQuestionModel } from "@/types/interview";

interface MultiChoiceProps {
	question: MultiChoiceQuestionModel;
	value?: string[];
	feedbackId: string;
	onChange: (value: string[]) => void;
	disabled?: boolean;
}

export function MultiChoice({
	question,
	value = [],
	feedbackId,
	onChange,
	disabled = false,
}: MultiChoiceProps) {
	function toggleOption(optionValue: string, checked: boolean) {
		onChange(
			checked
				? [...value, optionValue]
				: value.filter((selectedValue) => selectedValue !== optionValue),
		);
	}

	return (
		<fieldset
			className="interview-options"
			aria-required={question.required || undefined}
			aria-invalid={question.required && value.length === 0 ? true : undefined}
			aria-describedby={`${question.id}-instruction ${feedbackId}`}
		>
			<legend className="interview-question__prompt">{question.text}</legend>
			<p id={`${question.id}-instruction`} className="interview-question__instruction">
				Choose all that apply{question.required ? " · select at least one" : " · optional"}
			</p>
			{question.options.map((option) => (
				<label
					key={option.id}
					className={`interview-option motion-selectable ${
						value.includes(option.value)
							? "interview-option--selected"
							: ""
					}`}
				>
					<input
						type="checkbox"
						name={question.id}
						value={option.value}
						checked={value.includes(option.value)}
						disabled={disabled}
						onChange={(event) => toggleOption(option.value, event.target.checked)}
						className="accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					/>
					<span className="interview-option__label">{option.label}</span>
					<span className="interview-option__check" aria-hidden="true">
						{value.includes(option.value) ? "✓" : ""}
					</span>
				</label>
			))}
		</fieldset>
	);
}
