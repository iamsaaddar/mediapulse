import type { SingleChoiceQuestion as SingleChoiceQuestionModel } from "@/types/interview";

interface SingleChoiceProps {
	question: SingleChoiceQuestionModel;
	value?: string;
	feedbackId: string;
	onChange: (value: string) => void;
}

export function SingleChoice({
	question,
	value,
	feedbackId,
	onChange,
}: SingleChoiceProps) {
	return (
		<fieldset
			className="space-y-3"
			aria-required={question.required || undefined}
			aria-invalid={question.required && !value ? true : undefined}
			aria-describedby={`${question.id}-instruction ${feedbackId}`}
		>
			<legend className="mb-4 text-lg font-medium">{question.text}</legend>
			<p id={`${question.id}-instruction`} className="mb-4 text-sm text-muted">
				Choose one option{question.required ? " · required" : " · optional"}
			</p>
			{question.options.map((option) => {
				const selected = value === option.value;

				return (
					<label
						key={option.id}
						className={`motion-selectable flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
							selected
								? "border-accent bg-accent-subtle ring-1 ring-accent/50"
								: "border-control-border bg-surface hover:bg-surface-elevated"
						}`}
					>
						<input
							type="radio"
							name={question.id}
							value={option.value}
							checked={selected}
							required={question.required}
							onChange={() => onChange(option.value)}
							className="accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						/>
						<span>{option.label}</span>
					</label>
				);
			})}
		</fieldset>
	);
}
