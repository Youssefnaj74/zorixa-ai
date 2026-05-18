"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Shown under Video Preview on Reference to Video — Seedance 2.0 Atlas R2V only. */
export function SeedanceReferenceToVideoTip({ className }: { className?: string }) {
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
          <span className="font-semibold text-white/90">Seedance 2.0 · Atlas Reference-to-Video:</span>{" "}
          upload up to 4 <span className="font-medium text-white/85">AI-generated</span> images (Ref
          1–4), then describe the scene using{" "}
          <span className="font-medium text-white/85">image 1</span>,{" "}
          <span className="font-medium text-white/85">image 2</span>, etc. in the prompt.
        </span>
      </p>
      <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
        This tab uses the Atlas Cloud{" "}
        <span className="font-medium text-white/80">reference-to-video</span> API for Seedance 2.0
        only. Kling and other models have their own pipelines — pick Seedance 2.0 here (locked in the
        model menu).
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
