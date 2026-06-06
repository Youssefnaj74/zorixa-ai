"use client";

import { Circle, Clapperboard } from "lucide-react";

import {
  formatVideoElapsed,
  type VideoGenStage,
  videoGenerationStages
} from "@/lib/video-generation-progress";
import { cn } from "@/lib/utils";

function StageRow({ stage }: { stage: VideoGenStage }) {
  return (
    <li className="flex items-start gap-2.5 text-left text-xs leading-snug">
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-xs">
        {stage.status === "done" ? (
          <span className="text-[#a78bfa]" aria-hidden>
            ✓
          </span>
        ) : stage.status === "active" ? (
          <span className="text-[#c084fc]" aria-hidden>
            ⏳
          </span>
        ) : (
          <Circle className="size-3 text-white/25" aria-hidden />
        )}
      </span>
      <span
        className={cn(
          stage.status === "done" && "text-white/75",
          stage.status === "active" && "font-medium text-white",
          stage.status === "pending" && "text-white/35"
        )}
      >
        {stage.label}
      </span>
    </li>
  );
}

export function VideoGenerationProgress({
  modelLabel,
  elapsedSec,
  directorRouted = false,
  tip,
  showSlowBanner = false,
  canTryAnother = false,
  onCancel,
  onKeepWaiting,
  onTryAnother,
  className
}: {
  modelLabel: string;
  elapsedSec: number;
  directorRouted?: boolean;
  tip: string;
  showSlowBanner?: boolean;
  canTryAnother?: boolean;
  onCancel: () => void;
  onKeepWaiting?: () => void;
  onTryAnother?: () => void;
  className?: string;
}) {
  const stages = videoGenerationStages(elapsedSec, directorRouted);

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-stretch gap-4 px-2 sm:px-4",
        className
      )}
    >
      <div className="rounded-2xl border border-[#8338eb]/35 bg-[#12121a]/95 px-5 py-5 shadow-[0_0_40px_rgba(131,56,235,0.18)] ring-1 ring-white/5">
        <div className="space-y-3 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-white">
            <Clapperboard className="size-4 shrink-0 text-[#c084fc]" aria-hidden />
            <span>
              Generating with <span className="text-[#c084fc]">{modelLabel}</span>
            </span>
          </p>
          <p className="font-mono text-xl tabular-nums tracking-wide text-white/95">
            Elapsed: {formatVideoElapsed(elapsedSec)}
          </p>
        </div>

        <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
          {stages.map((stage) => (
            <StageRow key={stage.label} stage={stage} />
          ))}
        </ul>

        <p className="mt-4 border-t border-white/10 pt-4 text-center text-xs leading-relaxed text-white/50">
          💡 {tip}
        </p>
      </div>

      {showSlowBanner ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left">
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
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onCancel}
        className="mx-auto rounded-lg border border-white/15 bg-black/40 px-5 py-2 text-xs font-semibold text-white/90 transition-colors hover:bg-black/60 hover:text-white"
      >
        Cancel
      </button>
    </div>
  );
}
