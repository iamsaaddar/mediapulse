import { cx } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  valueText?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label = "Progress",
  valueText,
  className = "",
}: ProgressBarProps) {
  const safeMax = Number.isFinite(max) ? Math.max(max, 1) : 100;
  const safeValue = Number.isFinite(value)
    ? Math.min(safeMax, Math.max(0, value))
    : 0;
  const percentage = (safeValue / safeMax) * 100;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
      aria-valuetext={valueText}
      className={cx(
        "h-2 w-full overflow-hidden rounded-full bg-surface-muted",
        className,
      )}
    >
      <div
        className="motion-progress h-full rounded-full bg-accent"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
