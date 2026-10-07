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
		<div className="space-y-3">
			<label htmlFor={inputId} className="block text-lg font-medium">
				{question.text}
			</label>
			<p id={`${question.id}-instruction`} className="text-sm text-muted">
				{question.required ? "A response is required." : "Your response is optional."}
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
				className="w-full resize-y rounded-lg border border-control-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
			/>
		</div>
	);
}
