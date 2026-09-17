import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "muted" | "success" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-elevated text-foreground",
  muted: "bg-surface-muted text-muted",
  success: "bg-success text-success-foreground",
  danger: "bg-danger text-danger-foreground",
};

export function Badge({
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1",
        "text-xs font-medium",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}