"use client";

import { Sparkles } from "lucide-react";

import type { DirectorExample } from "@/lib/ai-director/types";
import { cn } from "@/lib/utils";

export function DirectorExamples({
  examples,
  activeId,
  onSelect,
  className
}: {
  examples: DirectorExample[];
  activeId?: string | null;
  onSelect: (example: DirectorExample) => void;
  className?: string;
}) {
  if (examples.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/45">
        <Sparkles className="size-3 text-[#c084fc]/80" aria-hidden />
        AI Director Examples
      </p>
      <div className="flex flex-wrap gap-2">
        {examples.map((item) => {
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-[#8338eb]/50 bg-[#8338eb]/20 text-white"
                  : "border-white/10 bg-white/[0.04] text-white/75 hover:border-[#8338eb]/35 hover:bg-[#8338eb]/10 hover:text-white"
              )}
            >
              <span aria-hidden>{item.emoji}</span> {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
