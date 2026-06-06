"use client";

import { Clapperboard } from "lucide-react";

import {
  directorTypicalTimeHint,
  formatDirectorElapsed
} from "@/lib/ai-director/generation-hints";
import type { DirectorQualityPreset } from "@/lib/ai-director/types";
import { cn } from "@/lib/utils";

export function DirectorGenerationProgress({
  modelLabel,
  qualityPreset,
  elapsedSec,
  showSlowBanner,
  canTryAnother,
  onCancel,
  onKeepWaiting,
  onTryAnother,
  className
}: {
  modelLabel: string;
  qualityPreset: DirectorQualityPreset;
  elapsedSec: number;
  showSlowBanner: boolean;
  canTryAnother: boolean;
  onCancel: () => void;
  onKeepWaiting: () => void;
  onTryAnother: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-center gap-4 px-4 text-center",
        className
      )}
    >
      <div className="size-12 animate-spin rounded-full border-2 border-[#8338eb]/30 border-t-[#8338eb]" />
      <div className="space-y-2">
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-white">
          <Clapperboard className="size-4 shrink-0 text-[#c084fc]" aria-hidden />
          Generating with {modelLabel}
        </p>
        <p className="font-mono text-lg tabular-nums tracking-wide text-white/90">
          Elapsed: {formatDirectorElapsed(elapsedSec)}
        </p>
        <p className="text-xs leading-relaxed text-white/50">
          Typical time:
          <br />
          {directorTypicalTimeHint(qualityPreset)}
        </p>
      </div>

      {!showSlowBanner ? (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-black/50 hover:text-white"
        >
          Cancel
        </button>
      ) : (
        <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left">
          <p className="text-sm font-semibold text-amber-100">Still working…</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            Atlas is taking longer than usual.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onKeepWaiting}
              className="rounded-lg border border-amber-400/30 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-black/40"
            >
              Keep Waiting
            </button>
            {canTryAnother ? (
              <button
                type="button"
                onClick={onTryAnother}
                className="rounded-lg border border-[#8338eb]/40 bg-[#8338eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#8338eb]/30"
              >
                Try Another Model
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
