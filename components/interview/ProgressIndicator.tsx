import { ProgressBar } from "@/components/ui/ProgressBar";
import { MAX_QUESTIONS } from "@/constants/limits";

interface ProgressIndicatorProps {
	currentQuestion: string | null;
	questions: ReadonlyArray<{ id: string }>;
	answeredCount: number;
}

function getStage(position: number): string {
	if (position < 0.34) return "Getting to know your taste";
	if (position < 0.7) return "Exploring what you enjoy";
	return "Refining your profile";
}

export function ProgressIndicator({
	currentQuestion,
	questions,
	answeredCount,
}: ProgressIndicatorProps) {
	const questionIndex = questions.findIndex(
		(question) => question.id === currentQuestion,
	);

	if (questionIndex < 0 || questions.length === 0) return null;

	const progress = Math.min((answeredCount / MAX_QUESTIONS) * 100, 99);
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
				valueText={`${answeredCount} answered. The interview adapts as your profile develops.`}
			/>
		</div>
	);
}
