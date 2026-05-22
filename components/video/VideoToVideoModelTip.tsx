"use client";

import { Sparkles } from "lucide-react";

import {
  videoToVideoTabUsesViduStartEnd,
  videoToVideoTabUsesWanV2v
} from "@/components/video/bottom-bar-models";
import { cn } from "@/lib/utils";

export function VideoToVideoModelTip({
  composerModelId,
  className
}: {
  composerModelId: string;
  className?: string;
}) {
  const wanEdit = videoToVideoTabUsesWanV2v(composerModelId);
  const happyhorse = composerModelId === "happyhorse-1";
  const vidu = videoToVideoTabUsesViduStartEnd(composerModelId);

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
          <span className="font-semibold text-white/90">Video to Video —</span> edit or transform an
          existing clip. Character swap pipelines live on the{" "}
          <span className="font-medium text-white/85">Character Swap</span> tab.
        </span>
      </p>
      <ul className="mt-2 space-y-1.5 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
        <li className={cn(wanEdit && "font-medium text-white/90")}>
          <span className="text-white/80">Wan 2.6 / 2.7</span> — source video + prompt (Atlas
          video-edit).
        </li>
        <li className={cn(happyhorse && "font-medium text-white/90")}>
          <span className="text-white/80">HappyHorse 1.0</span> — source video + prompt; up to 5
          optional reference images (Atlas video-edit).
        </li>
        <li className={cn(vidu && "font-medium text-white/90")}>
          <span className="text-white/80">Vidu Q3-Pro</span> — start + end frame + prompt.
        </li>
      </ul>
      {wanEdit || happyhorse ? (
        <p className="mt-2 border-t border-white/10 pt-2 pl-5 text-[11px] leading-relaxed text-brand/95">
          Selected: {happyhorse ? "HappyHorse 1.0" : "Wan 2.6 / 2.7"} — upload{" "}
          <span className="font-medium text-white/85">Source video</span>
          {happyhorse ? (
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
