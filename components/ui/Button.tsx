import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/80",
  secondary:
    "border border-control-border bg-surface text-foreground hover:bg-surface-elevated active:bg-surface-muted",
  ghost: "text-muted hover:bg-surface hover:text-foreground active:bg-surface-muted",
  danger:
    "bg-danger text-danger-foreground hover:bg-danger/90 active:bg-danger/80",
};

const buttonClasses = [
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5",
  "text-sm font-medium motion-button",
  "focus-visible:outline-2 focus-visible:outline-offset-3",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

function LoadingIndicator() {
  return (
    <span
      aria-hidden="true"
      className="motion-spinner inline-block h-4 w-4 rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export function Button({
  variant = "primary",
  fullWidth = false,
  loading = false,
  className = "",
  type = "button",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        buttonClasses,
        variantClasses[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <LoadingIndicator /> : null}
      {children}
    </button>
  );
}
