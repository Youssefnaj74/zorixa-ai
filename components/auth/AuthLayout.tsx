import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthLayout({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-16",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-90" aria-hidden />
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
