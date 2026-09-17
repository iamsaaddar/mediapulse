import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "muted";
}

const variantClasses = {
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
      className={[
        "rounded-xl border p-5",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}