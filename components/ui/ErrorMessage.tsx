import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  action?: ReactNode;
}

export function ErrorMessage({
  title = "Something went wrong",
  message,
  action,
  className = "",
  ...props
}: ErrorMessageProps) {
  return (
    <div
      {...props}
      role="alert"
      aria-atomic="true"
      className={cx(
        "rounded-xl border border-error/40 bg-error/10 p-4 sm:p-5",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-muted">{message}</p>

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
