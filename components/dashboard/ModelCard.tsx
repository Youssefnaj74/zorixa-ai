import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ModelCardProps = {
  name: string;
  description: string;
  icon: LucideIcon;
  isNew?: boolean;
  className?: string;
};

export function ModelCard({ name, description, icon: Icon, isNew = true, className }: ModelCardProps) {
  return (
    <article
      className={cn(
        "group flex min-w-[240px] flex-col gap-3 rounded-2xl border border-surface-border bg-surface-card p-4 transition-shadow duration-300 hover:shadow-glow",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-elevated text-brand">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        {isNew ? (
          <span className="rounded-full bg-brand px-2 py-0.5 font-heading text-xs font-semibold text-white">
            NEW
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <h3 className="font-heading text-base font-bold leading-snug text-white">{name}</h3>
        <p className="mt-1 font-body text-sm leading-relaxed text-white/50">{description}</p>
      </div>
    </article>
  );
}
