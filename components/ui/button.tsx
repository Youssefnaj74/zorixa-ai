import * as React from "react";

import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-brand text-white hover:bg-brand-light",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-white hover:bg-white/10",
        variant === "ghost" && "bg-transparent text-white hover:bg-white/10",
        className
      )}
      {...props}
    />
  );
}
