import type { HTMLAttributes } from "react";
import { cx } from "@/lib/utils";

type BadgeVariant = "default" | "muted" | "accent" | "success" | "error" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-elevated text-foreground",
  muted: "bg-surface-muted text-muted",
  accent: "bg-accent-subtle text-accent",
  success: "bg-success text-success-foreground",
  error: "bg-error text-error-foreground",
  danger: "bg-danger text-danger-foreground",
};

export function Badge({
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium leading-5",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
