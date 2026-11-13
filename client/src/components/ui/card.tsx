import React from "react";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "danger" | "compact";
  children: React.ReactNode;
}

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "flex flex-col rounded-xl border border-border shadow-sm",
        {
          "bg-surface p-6": variant === "default",
          "bg-surface p-6 hover:bg-surface-elevated transition-colors cursor-pointer":
            variant === "interactive",
          "bg-surface p-4": variant === "compact",
          "bg-error-light/5 border-error/20 p-6": variant === "danger",
        },
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
