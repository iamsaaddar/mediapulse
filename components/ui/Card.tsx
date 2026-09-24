import type { HTMLAttributes } from "react";
import { cx } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "muted";
}

const variantClasses: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-surface border-border",
  elevated: "bg-surface-elevated border-border-strong",
  muted: "bg-surface-muted border-border",
};

export function Card({
  variant = "default",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={cx(
        "rounded-xl border p-4 text-foreground sm:p-5",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
