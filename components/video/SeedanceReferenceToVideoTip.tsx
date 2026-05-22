"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { isHappyHorseComposerId } from "@/lib/atlas-happyhorse-video";
import { isViduQ3ComposerId } from "@/lib/atlas-vidu-video";
import {
  isVeo31ComposerId,
  VEO_31_REFERENCE_DURATION_SECONDS
} from "@/lib/atlas-veo31-video";
import { referenceToVideoMaxImages } from "@/components/video/bottom-bar-models";

/** Shown under Video Preview on Reference to Video. */
export function SeedanceReferenceToVideoTip({
  composerModelId = "seedance-2",
  className
}: {
  composerModelId?: string;
  className?: string;
}) {
  const vidu = isViduQ3ComposerId(composerModelId);
  const happyhorse = isHappyHorseComposerId(composerModelId);
  const veo = isVeo31ComposerId(composerModelId);
  const seedance = composerModelId === "seedance-2";
  const maxRefs = referenceToVideoMaxImages(composerModelId);
  const modelLabel = veo
    ? "Google Veo 3.1 · Atlas Reference-to-Video"
    : happyhorse
      ? "HappyHorse 1.0 · Atlas Reference-to-Video"
      : vidu
        ? "Vidu Q3 · Atlas Reference-to-Video"
        : "Seedance 2.0 · Atlas Reference-to-Video";
  const atlasSlug = veo
    ? "google/veo3.1/reference-to-video"
    : happyhorse
      ? "alibaba/happyhorse-1.0/reference-to-video"
      : vidu
        ? "vidu/q3/reference-to-video"
        : "bytedance/seedance-2.0/reference-to-video";
  return (
    <div
      role="note"
      className={cn(
        "rounded-xl border border-[rgba(131,56,235,0.28)] bg-[rgba(131,56,235,0.08)] px-3 py-2.5 text-left",
        className
      )}
    >
      {seedance ? (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-zorixa-muted">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
          <span>
            <span className="font-semibold text-white/90">{modelLabel}</span> — use the{" "}
            <span className="font-medium text-white/85">reference panel</span> below (images ·
            videos · audios). Tags like <span className="font-medium text-brand">@image1</span> are
            added to your prompt automatically.
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-zorixa-muted">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
          <span>
            <span className="font-semibold text-white/90">{modelLabel}:</span> upload up to {maxRefs}{" "}
            reference images
            {veo ? `, ${VEO_31_REFERENCE_DURATION_SECONDS}s clip, 720p or 1080p` : ""}, then describe
            the scene in the prompt.
          </span>
        </p>
      )}
      <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
        Atlas model: <span className="font-medium text-white/80">{atlasSlug}</span>
        {vidu ? (
          <>
            {" "}
            · Mix tier:{" "}
            <span className="font-medium text-white/80">vidu/q3-mix/reference-to-video</span>
          </>
        ) : null}
      </p>
      {!seedance ? (
        <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
          <span className="font-medium text-brand/90">Tip:</span>{" "}
          <Link href="/image" className="font-medium text-brand underline-offset-2 hover:underline">
            Generate images
          </Link>{" "}
          first, then upload refs and Generate.
        </p>
      ) : (
        <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
          Need at least one <span className="font-medium text-white/80">image or video</span> ref.
          Real-camera face photos may be blocked by ByteDance policy.
        </p>
      )}
    </div>
  );
}
