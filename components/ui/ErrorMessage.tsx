import type { ReactNode } from "react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export function ErrorMessage({
  title = "Something went wrong",
  message,
  action,
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/40 bg-danger/10 p-5"
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-muted">{message}</p>

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}