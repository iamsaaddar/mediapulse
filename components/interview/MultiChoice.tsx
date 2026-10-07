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
			className="space-y-3"
			aria-required={question.required || undefined}
			aria-invalid={question.required && value.length === 0 ? true : undefined}
			aria-describedby={`${question.id}-instruction ${feedbackId}`}
		>
			<legend className="mb-4 text-lg font-medium">{question.text}</legend>
			<p id={`${question.id}-instruction`} className="mb-4 text-sm text-muted">
				Choose all that apply{question.required ? " · select at least one" : " · optional"}
			</p>
			{question.options.map((option) => (
				<label
					key={option.id}
					className={`motion-selectable flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
						value.includes(option.value)
							? "border-accent bg-accent-subtle ring-1 ring-accent/50"
							: "border-control-border bg-surface hover:bg-surface-elevated"
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
					<span>{option.label}</span>
				</label>
			))}
		</fieldset>
	);
}
