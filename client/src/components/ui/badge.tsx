import React from "react";
import clsx from "clsx";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "outline";
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-medium border",
        {
          "bg-surface-elevated text-text-secondary border-border": variant === "default",
          "bg-primary-light text-primary border-primary/20": variant === "primary",
          "bg-success-light text-success border-success/20": variant === "success",
          "bg-warning-light text-warning border-warning/20": variant === "warning",
          "bg-error-light text-error border-error/20": variant === "danger",
          "bg-transparent text-text-secondary border-border": variant === "outline",
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
