import { cx } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

export function Spinner({
  size = "md",
  label = "Loading",
  className = "",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx(
        "motion-spinner inline-block rounded-full border-border border-t-accent",
        sizeClasses[size],
        className,
      )}
    />
  );
}
