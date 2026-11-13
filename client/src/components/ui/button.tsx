import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "default",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded",
        {
          // Variants
          "bg-primary text-white hover:bg-primary-hover shadow-glow": variant === "primary",
          "bg-surface-elevated border border-border text-text-primary hover:bg-border":
            variant === "secondary",
          "text-text-secondary hover:text-text-primary hover:bg-surface-elevated":
            variant === "ghost",
          "bg-error/20 border border-error/50 text-error hover:bg-error/30": variant === "danger",
          "text-text-secondary hover:text-text-primary": variant === "icon",

          // Sizes
          "h-9 px-4 text-[11px]": size === "default" && variant !== "icon",
          "h-7 px-3 text-[10px]": size === "sm" && variant !== "icon",
          "h-11 px-6 text-sm": size === "lg" && variant !== "icon",
          "h-8 w-8": size === "icon" || variant === "icon",

          "w-full": fullWidth,
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
