"use client";

import { cn } from "@/lib/utils";

export function DirectorReasoningCard({
  modelLabel,
  summary,
  onWhyClick,
  className
}: {
  modelLabel: string;
  summary: string;
  onWhyClick: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 overflow-hidden rounded-lg border border-[#8338eb]/25 bg-[#8338eb]/10",
        className
      )}
    >
      <div className="min-w-0 flex-1 px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#c084fc]">
          <span aria-hidden>🤖</span>
          AI Director chose {modelLabel}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">{summary}</p>
      </div>
      <button
        type="button"
        onClick={onWhyClick}
        className={cn(
          "flex w-[72px] shrink-0 flex-col items-center justify-center self-stretch",
          "border-l border-[#8338eb]/25 bg-black/20 px-2",
          "text-[11px] font-bold uppercase tracking-wide text-white/85 transition-colors",
          "hover:bg-[#8338eb]/15 hover:text-white"
        )}
      >
        Why?
      </button>
    </div>
  );
}
