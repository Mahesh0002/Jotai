import React from "react";
import clsx from "clsx";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger" | "icon" | "default" | (string & {});

export type ButtonSize = "default" | "sm" | "lg" | "icon" | (string & {});

type NativeButtonProps = {
  [K in keyof React.ButtonHTMLAttributes<HTMLButtonElement>]?:
    React.ButtonHTMLAttributes<HTMLButtonElement>[K] | undefined;
};

export type ButtonProps = NativeButtonProps & {
  ref?: React.Ref<HTMLButtonElement> | undefined;
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
};

export function buttonVariants({
  variant = "primary",
  size = "default",
  fullWidth = false,
}: {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
} = {}) {
  const resolvedVariant = variant === "default" ? "primary" : variant;
  return clsx(
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded",
    {
      "bg-primary text-white hover:bg-primary-hover shadow-glow": resolvedVariant === "primary",
      "bg-surface-elevated border border-border text-text-primary hover:bg-border":
        resolvedVariant === "secondary",
      "border border-border bg-transparent text-text-primary hover:bg-surface-elevated":
        resolvedVariant === "outline",
      "text-text-secondary hover:text-text-primary hover:bg-surface-elevated":
        resolvedVariant === "ghost",
      "bg-error/20 border border-error/50 text-error hover:bg-error/30":
        resolvedVariant === "danger",
      "text-text-secondary hover:text-text-primary": resolvedVariant === "icon",

      "h-9 px-4 text-[11px]": size === "default" && variant !== "icon",
      "h-7 px-3 text-[10px]": size === "sm" && variant !== "icon",
      "h-11 px-6 text-sm": size === "lg" && variant !== "icon",
      "h-8 w-8": size === "icon" || variant === "icon",

      "w-full": fullWidth,
    },
  );
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
    <button className={clsx(buttonVariants({ variant, size, fullWidth }), className)} {...props}>
      {children}
    </button>
  );
}
