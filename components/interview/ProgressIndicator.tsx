import { ProgressBar } from "@/components/ui/ProgressBar";

interface ProgressIndicatorProps {
	currentQuestion: string | null;
	questions: ReadonlyArray<{ id: string }>;
}

function getStage(position: number): string {
	if (position < 0.34) return "Getting to know your taste";
	if (position < 0.7) return "Exploring what you enjoy";
	return "Refining your profile";
}

export function ProgressIndicator({
	currentQuestion,
	questions,
}: ProgressIndicatorProps) {
	const questionIndex = questions.findIndex(
		(question) => question.id === currentQuestion,
	);

	if (questionIndex < 0 || questions.length === 0) return null;

	// Keep the active interview below 100%: the adaptive flow can still add questions.
	const progress = (questionIndex / questions.length) * 100;
	const stage = getStage(progress / 100);

	return (
		<div className="space-y-2" aria-live="polite">
			<div className="flex items-center justify-between gap-4">
				<p className="type-label text-muted">Interview progress</p>
				<p className="text-sm font-medium text-foreground">{stage}</p>
			</div>
			<ProgressBar
				value={progress}
				label="Adaptive interview progress"
				valueText={`${stage}. Additional questions may be added as your profile develops.`}
			/>
		</div>
	);
}
