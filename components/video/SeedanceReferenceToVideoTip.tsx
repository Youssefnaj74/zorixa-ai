"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { isViduQ3ComposerId } from "@/lib/atlas-vidu-video";

/** Shown under Video Preview on Reference to Video. */
export function SeedanceReferenceToVideoTip({
  composerModelId = "seedance-2",
  className
}: {
  composerModelId?: string;
  className?: string;
}) {
  const vidu = isViduQ3ComposerId(composerModelId);
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
          <span className="font-semibold text-white/90">
            {vidu ? "Vidu Q3 · Atlas Reference-to-Video" : "Seedance 2.0 · Atlas Reference-to-Video"}:
          </span>{" "}
          upload up to 4 reference images (Ref 1–4), then describe the scene using{" "}
          <span className="font-medium text-white/85">image 1</span>,{" "}
          <span className="font-medium text-white/85">image 2</span>, etc. in the prompt.
        </span>
      </p>
      <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
        Atlas:{" "}
        <span className="font-medium text-white/80">
          {vidu ? "vidu/q3/reference-to-video" : "bytedance/seedance-2.0/reference-to-video"}
        </span>
        {vidu ? (
          <>
            {" "}
            or <span className="font-medium text-white/80">vidu/q3-mix/reference-to-video</span> via
            SPEED <span className="font-medium text-white/85">Mix</span>
          </>
        ) : null}
        . Pick <span className="font-medium text-white/85">Vidu Q3</span> or{" "}
        <span className="font-medium text-white/85">Seedance 2.0</span> in the model menu.
      </p>
      <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
        <span className="font-medium text-brand/90">Workflow:</span>{" "}
        <Link href="/image" className="font-medium text-brand underline-offset-2 hover:underline">
          Generate reference images
        </Link>
        {" → "}upload Ref 1–4 → Generate. Real camera photos are often blocked by ByteDance policy.
      </p>
    </div>
  );
}
