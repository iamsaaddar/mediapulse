interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

export function Spinner({
  size = "md",
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-block animate-spin rounded-full border-border border-t-foreground",
        sizeClasses[size],
      ].join(" ")}
    />
  );
}