"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { isHappyHorseComposerId } from "@/lib/atlas-happyhorse-video";
import {
  GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_MAX_REFERENCE_IMAGES
} from "@/lib/atlas-grok-video";
import { isWan27ComposerId, WAN_27_REFERENCE_MAX_MATERIALS } from "@/lib/atlas-wan-27-video";
import { isViduQ3ComposerId } from "@/lib/atlas-vidu-video";
import {
  isVeo31ComposerId,
  VEO_31_REFERENCE_DURATION_SECONDS
} from "@/lib/atlas-veo31-video";
import { referenceToVideoMaxImages } from "@/components/video/bottom-bar-models";
import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";

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
  const grok = composerModelId === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID;
  const veo = isVeo31ComposerId(composerModelId);
  const wan = isWan27ComposerId(composerModelId);
  const seedance = composerModelId === "seedance-2";
  const maxRefs = referenceToVideoMaxImages(composerModelId);
  const modelLabel = grok
    ? "Grok Imagine · Atlas Reference-to-Video"
    : veo
      ? "Google Veo 3.1 · Atlas Reference-to-Video"
      : wan
        ? "Wan 2.7 · Atlas Reference-to-Video"
        : happyhorse
          ? "HappyHorse 1.0 · Atlas Reference-to-Video"
          : vidu
            ? "Vidu Q3 · Atlas Reference-to-Video"
            : "Seedance 2.0 · Atlas Reference-to-Video";
  const atlasSlug = grok
    ? "xai/grok-imagine-video/reference-to-video"
    : veo
      ? "google/veo3.1/reference-to-video"
      : wan
        ? "alibaba/wan-2.7/reference-to-video"
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
      {seedance || wan ? (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-zorixa-muted">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
          <span>
            <span className="font-semibold text-white/90">{modelLabel}</span> — use the{" "}
            <span className="font-medium text-white/85">reference panel</span> below (
            {wan ? "images · videos · voice" : "images · videos · audios"}).{" "}
            {seedance ? (
              <>
                Tags like <span className="font-medium text-brand">@image1</span> and{" "}
                <span className="font-medium text-brand">@video1</span> are added to your prompt
                automatically when you upload refs.
              </>
            ) : (
              <>
                Name subjects <span className="font-medium text-brand">character1</span>,{" "}
                <span className="font-medium text-brand">character2</span> in the prompt (max{" "}
                {WAN_27_REFERENCE_MAX_MATERIALS} image+video refs).
              </>
            )}
          </span>
        </p>
      ) : grok ? (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-zorixa-muted">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
          <span>
            <span className="font-semibold text-white/90">{modelLabel}:</span> upload 1–
            {GROK_IMAGINE_VIDEO_MAX_REFERENCE_IMAGES} reference images (480p or 720p, 1–10s). In the
            prompt, use tags like <span className="font-medium text-brand">{"<IMAGE_1>"}</span>,{" "}
            <span className="font-medium text-brand">{"<IMAGE_2>"}</span> to attach each image to a
            scene element.
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
      {grok ? (
        <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
          <span className="font-medium text-brand/90">Tip:</span>{" "}
          <Link href="/image" className="font-medium text-brand underline-offset-2 hover:underline">
            Generate images
          </Link>{" "}
          first, then upload refs and reference them with{" "}
          <span className="font-medium text-brand">{"<IMAGE_N>"}</span> in your prompt.
        </p>
      ) : !seedance && !wan ? (
        <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
          <span className="font-medium text-brand/90">Tip:</span>{" "}
          <Link href="/image" className="font-medium text-brand underline-offset-2 hover:underline">
            Generate images
          </Link>{" "}
          first, then upload refs and Generate.
        </p>
      ) : wan ? (
        <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
          Need at least one <span className="font-medium text-white/80">image or video</span> ref.
          Duration 2–10s · optional voice clone audio.
        </p>
      ) : (
        <p className="mt-2 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
          Need at least one <span className="font-medium text-white/80">image or video</span> ref.
          Use <span className="font-medium text-brand">720p</span>,{" "}
          <span className="font-medium text-brand">1080p</span>, or{" "}
          <span className="font-medium text-brand">4K</span>. ByteDance may block reference images
          that look like real people — even AI cinematic shots. Try{" "}
          <span className="font-medium text-brand">video ref only</span> (@video1, no images) or{" "}
          <Link
            href={buildCatalogStudioHref("text-to-video", "seedance-2")}
            className="font-medium text-brand underline-offset-2 hover:underline"
          >
            Text to Video
          </Link>
          .
        </p>
      )}
    </div>
  );
}
