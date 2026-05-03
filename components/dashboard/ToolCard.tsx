import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToolBadge =
  | { kind: "promo"; label: "NEW" | "HOT" | "POPULAR"; variant: "accent" }
  | { kind: "off"; percent: number };

export type ToolCardProps = {
  name: string;
  description: string;
  icon: LucideIcon;
  badges?: ToolBadge[];
  className?: string;
};

export function ToolCard({ name, description, icon: Icon, badges, className }: ToolCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-surface-border bg-surface-card p-1 transition-shadow duration-300 hover:shadow-glow-lg",
        className
      )}
    >
      <div className="relative flex flex-col gap-3 rounded-[14px] bg-gradient-to-br from-brand-dark to-brand p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-elevated/90 ring-1 ring-surface-border">
            <Icon className="size-5 text-white" strokeWidth={1.75} aria-hidden />
          </span>
          {badges && badges.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-1.5">
              {badges.map((b, i) =>
                b.kind === "off" ? (
                  <span
                    key={`off-${i}`}
                    className="rounded-full bg-surface-elevated px-2 py-0.5 font-heading text-xs font-bold text-white ring-1 ring-surface-border"
                  >
                    {b.percent}% OFF
                  </span>
                ) : (
                  <span
                    key={`tag-${b.label}-${i}`}
                    className={cn(
                      "rounded-full px-2 py-0.5 font-heading text-xs font-semibold ring-1",
                      b.variant === "accent" && "bg-brand/25 text-white ring-brand/40"
                    )}
                  >
                    {b.label}
                  </span>
                )
              )}
            </div>
          ) : null}
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold leading-snug text-white">{name}</h3>
          <p className="mt-1 font-body text-sm leading-relaxed text-white/50">{description}</p>
        </div>
      </div>
    </article>
  );
}
