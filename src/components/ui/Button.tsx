import type { ButtonHTMLAttributes, ReactNode } from "react";
import classNames from "classnames";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
        {
          "bg-white text-creax-blueDark shadow hover:bg-slate-100":
            variant === "primary",
          "border border-white/40 bg-transparent text-white hover:bg-white/10":
            variant === "secondary",
          "bg-transparent text-white hover:bg-white/10":
            variant === "ghost",
          "w-full": fullWidth
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}







































