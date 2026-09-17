import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-elevated",
  ghost: "text-muted hover:bg-surface hover:text-foreground",
  danger: "bg-danger text-danger-foreground hover:opacity-90",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5",
        "text-sm font-medium transition-opacity",
        "focus-visible:outline-2 focus-visible:outline-offset-3",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}