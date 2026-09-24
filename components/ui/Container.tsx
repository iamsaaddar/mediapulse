import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cx } from "@/lib/utils";

type ContainerWidth = "page" | "content" | "reading" | "interview";

type ContainerProps<T extends ElementType> = {
  as?: T;
  width?: ContainerWidth;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "width">;

const widthClasses: Record<ContainerWidth, string> = {
  page: "page-container",
  content: "content-container",
  reading: "reading-container",
  interview: "interview-container",
};

export function Container<T extends ElementType = "div">({
  as,
  width = "content",
  className = "",
  ...props
}: ContainerProps<T>) {
  const Component = as ?? "div";
  return (
    <Component
      className={cx(widthClasses[width], className)}
      {...props}
    />
  );
}
