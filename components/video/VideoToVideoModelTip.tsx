"use client";

import { Sparkles } from "lucide-react";

import {
  videoToVideoTabUsesKlingMotion,
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
  const kling = videoToVideoTabUsesKlingMotion(composerModelId);
  const wan = videoToVideoTabUsesWanV2v(composerModelId);

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
          <span className="font-semibold text-white/90">Video to Video —</span> same tab, two Atlas
          models. Pick one in the bottom bar <span className="font-medium text-white/85">Model</span>{" "}
          menu.
        </span>
      </p>
      <ul className="mt-2 space-y-1.5 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
        <li className={cn(wan && "font-medium text-white/90")}>
          <span className="text-white/80">Wan 2.6</span> — source video + prompt (transform / restyle
          the clip).
        </li>
        <li className={cn(kling && "font-medium text-white/90")}>
          <span className="text-white/80">Kling 2.6 Motion</span> — character image + motion clip
          (dance, gesture). Prompt = style / lighting only.
        </li>
      </ul>
      {kling ? (
        <p className="mt-2 border-t border-white/10 pt-2 pl-5 text-[11px] leading-relaxed text-brand/95">
          Selected: Kling — upload <span className="font-medium text-white/85">Character</span> +{" "}
          <span className="font-medium text-white/85">Motion clip</span>. Use Standard/Fast for Pro vs
          Std on Atlas.
        </p>
      ) : wan ? (
        <p className="mt-2 border-t border-white/10 pt-2 pl-5 text-[11px] leading-relaxed text-brand/95">
          Selected: Wan — upload <span className="font-medium text-white/85">Source video</span>, then
          describe the change in the prompt.
        </p>
      ) : null}
    </div>
  );
}
