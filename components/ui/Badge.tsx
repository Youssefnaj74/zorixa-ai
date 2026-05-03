import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "new" | "newBlue" | "newTeal" | "fullAccess" | "pro";

const variants: Record<BadgeVariant, string> = {
  new: "bg-zorixa-accent text-white",
  newBlue: "bg-zorixa-tab text-white",
  newTeal: "bg-zorixa-badge-new text-white",
  fullAccess: "bg-zorixa-badge-full text-white",
  pro: "bg-zorixa-badge-pro text-white"
};

export function Badge({
  children,
  variant = "new",
  className
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
