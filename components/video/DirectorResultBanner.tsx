"use client";

import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

export function DirectorResultBanner({
  modelLabel,
  styleLabel,
  creditsSpent,
  loading,
  canTryAnother,
  onRegenerate,
  onTryAnother,
  className
}: {
  modelLabel: string;
  styleLabel: string;
  creditsSpent: number;
  loading?: boolean;
  canTryAnother: boolean;
  onRegenerate: () => void;
  onTryAnother: () => void;
  className?: string;
}) {
  const creditsText =
    creditsSpent > 0 ? `${creditsSpent} credits` : "Free";

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col gap-3 rounded-xl border border-[#8338eb]/30 bg-[#8338eb]/10 px-4 py-3",
        className
      )}
    >
      <div className="text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#c084fc]">
          <span aria-hidden>🏆</span>
          AI Director Result
        </p>
        <p className="mt-1 text-sm font-medium text-white">
          {modelLabel} · {styleLabel} · {creditsText}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={onRegenerate}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/50",
            loading && "cursor-not-allowed opacity-50"
          )}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden />
          Regenerate
        </button>
        {canTryAnother ? (
          <button
            type="button"
            disabled={loading}
            onClick={onTryAnother}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-[#8338eb]/40 bg-[#8338eb]/20 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8338eb]/30",
              loading && "cursor-not-allowed opacity-50"
            )}
          >
            Try Another Model
          </button>
        ) : null}
      </div>
    </div>
  );
}
