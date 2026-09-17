interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label = "Progress",
}: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const percentage = Math.min(
    100,
    Math.max(0, (value / safeMax) * 100),
  );

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
    >
      <div
        className="h-full rounded-full bg-accent transition-[width]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}