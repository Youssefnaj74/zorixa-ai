"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function isSeedanceVideoComposerId(composerModelId: string): boolean {
  return composerModelId === "seedance-2" || composerModelId === "seedance-1-5";
}

/** Image to Video — shown for Seedance 2.0 only (suggests 1.5 for real faces). */
export function SeedanceI2vReferenceTip({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        "rounded-xl border border-[rgba(131,56,235,0.28)] bg-[rgba(131,56,235,0.08)] px-3 py-2.5 text-left",
        className
      )}
    >
      <p className="flex items-start gap-2 text-xs leading-relaxed text-zorixa-muted">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
        <span>
          <span className="font-semibold text-white/90">Tip:</span> Seedance 2.0 often blocks real
          faces. Try <span className="font-medium text-white/85">Seedance 1.5</span> — it&apos;s more
          permissive with real-person images.
        </span>
      </p>
      <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
        <span className="font-medium text-brand/90">Workflow:</span>{" "}
        <Link href="/image" className="font-medium text-brand underline-offset-2 hover:underline">
          Generate a reference image
        </Link>
        {" → "}upload Start frame (optional End frame), then Generate video. Multi-image refs: use the{" "}
        <span className="font-medium text-white/80">Reference to Video</span> tab (2.0 only).
      </p>
    </div>
  );
}
