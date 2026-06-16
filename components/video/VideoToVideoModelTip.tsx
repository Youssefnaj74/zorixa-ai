"use client";

import { Sparkles } from "lucide-react";

import {
  videoToVideoTabUsesKlingMotion,
  videoToVideoTabUsesViduStartEnd,
  videoToVideoTabUsesWanCharacterSwap,
  videoToVideoTabUsesWanV2v
} from "@/components/video/bottom-bar-models";
import { isWan27ComposerId } from "@/lib/atlas-wan-27-video";
import { cn } from "@/lib/utils";

export function VideoToVideoModelTip({
  composerModelId,
  className
}: {
  composerModelId: string;
  className?: string;
}) {
  const wanEdit = videoToVideoTabUsesWanV2v(composerModelId);
  const wan27 = isWan27ComposerId(composerModelId);
  const happyhorse = composerModelId === "happyhorse-1";
  const vidu = videoToVideoTabUsesViduStartEnd(composerModelId);
  const klingMotion = videoToVideoTabUsesKlingMotion(composerModelId);
  const wanCharacterSwap = videoToVideoTabUsesWanCharacterSwap(composerModelId);

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
          <span className="font-semibold text-white/90">Video to Video —</span> edit, transform, or
          swap characters in an existing clip.
        </span>
      </p>
      <ul className="mt-2 space-y-1.5 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
        <li className={cn(wanEdit && !wan27 && "font-medium text-white/90")}>
          <span className="text-white/80">Wan 2.6</span> — source video + prompt (Atlas video-edit).
        </li>
        <li className={cn(wan27 && "font-medium text-white/90")}>
          <span className="text-white/80">Wan 2.7</span> — source video + prompt; up to 5 optional
          reference images (Atlas video-edit).
        </li>
        <li className={cn(happyhorse && "font-medium text-white/90")}>
          <span className="text-white/80">HappyHorse 1.0</span> — source video + prompt; up to 5
          optional reference images (Atlas video-edit).
        </li>
        <li className={cn(vidu && "font-medium text-white/90")}>
          <span className="text-white/80">Vidu Q3-Pro</span> — start + end frame + prompt.
        </li>
        <li className={cn(klingMotion && "font-medium text-white/90")}>
          <span className="text-white/80">Kling 2.6 Motion</span> — character image + motion clip.
        </li>
        <li className={cn(wanCharacterSwap && "font-medium text-white/90")}>
          <span className="text-white/80">Wan 2.2 Character Swap</span> — portrait + source video.
        </li>
      </ul>
      {klingMotion ? (
        <p className="mt-2 border-t border-white/10 pt-2 pl-5 text-[11px] leading-relaxed text-brand/95">
          Selected: Kling 2.6 Motion — <span className="font-medium text-white/85">Character</span>,{" "}
          <span className="font-medium text-white/85">Motion clip</span>, optional prompt, framing, ref audio,
          duration, tier (Pro/Std).
        </p>
      ) : wanCharacterSwap ? (
        <p className="mt-2 border-t border-white/10 pt-2 pl-5 text-[11px] leading-relaxed text-brand/95">
          Selected: Wan 2.2 — <span className="font-medium text-white/85">Portrait</span>,{" "}
          <span className="font-medium text-white/85">Source video</span>, optional prompt. Tier Std/Pro
          on Atlas.
        </p>
      ) : wan27 || happyhorse || (wanEdit && !wan27) ? (
        <p className="mt-2 border-t border-white/10 pt-2 pl-5 text-[11px] leading-relaxed text-brand/95">
          Selected:{" "}
          {happyhorse ? "HappyHorse 1.0" : wan27 ? "Wan 2.7" : "Wan 2.6"} — upload{" "}
          <span className="font-medium text-white/85">Source video</span>
          {happyhorse || wan27 ? (
            <>
              {" "}
              and optionally up to <span className="font-medium text-white/85">5 reference images</span>
            </>
          ) : null}
          , then describe the change.
        </p>
      ) : vidu ? (
        <p className="mt-2 border-t border-white/10 pt-2 pl-5 text-[11px] leading-relaxed text-brand/95">
          Selected: Vidu Q3-Pro — <span className="font-medium text-white/85">Start</span> +{" "}
          <span className="font-medium text-white/85">End</span> frames + prompt.
        </p>
      ) : null}
    </div>
  );
}
