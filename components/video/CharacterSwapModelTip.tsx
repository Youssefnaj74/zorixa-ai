"use client";

import { Sparkles } from "lucide-react";

import {
  videoToVideoTabUsesKlingMotion,
  videoToVideoTabUsesWanCharacterSwap
} from "@/components/video/bottom-bar-models";
import { cn } from "@/lib/utils";

export function CharacterSwapModelTip({
  composerModelId,
  className
}: {
  composerModelId: string;
  className?: string;
}) {
  const kling = videoToVideoTabUsesKlingMotion(composerModelId);
  const wanSwap = videoToVideoTabUsesWanCharacterSwap(composerModelId);

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
          <span className="font-semibold text-white/90">Character Swap —</span> portrait + source
          video. Pick{" "}
          <span className="font-medium text-white/85">Kling 2.6 Motion</span> (Pro/Std) or{" "}
          <span className="font-medium text-white/85">Wan 2.2 Character Swap</span> in the bottom bar.
        </span>
      </p>
      <ul className="mt-2 space-y-1.5 pl-5 text-[11px] leading-relaxed text-zorixa-muted/95">
        <li className={cn(kling && "font-medium text-white/90")}>
          <span className="text-white/80">Kling 2.6 Motion</span> — character image + motion clip.
          Prompt = style / lighting only.
        </li>
        <li className={cn(wanSwap && "font-medium text-white/90")}>
          <span className="text-white/80">Wan 2.2 Character Swap</span> — portrait + source video.
          Speed = Std / Pro on Atlas.
        </li>
      </ul>
      {wanSwap ? (
        <p className="mt-2 border-t border-white/10 pt-2 pl-5 text-[11px] leading-relaxed text-brand/95">
          Selected: Wan 2.2 — <span className="font-medium text-white/85">Portrait</span>,{" "}
          <span className="font-medium text-white/85">Source video</span>, optional prompt. Tier Std/Pro
          → <span className="font-medium text-white/85">wan-std</span> /{" "}
          <span className="font-medium text-white/85">wan-pro</span>.
        </p>
      ) : kling ? (
        <p className="mt-2 border-t border-white/10 pt-2 pl-5 text-[11px] leading-relaxed text-brand/95">
          Selected: Kling 2.6 Motion — <span className="font-medium text-white/85">Character</span>,{" "}
          <span className="font-medium text-white/85">Motion clip</span>, optional prompt, Framing,
          Ref audio, Duration, Tier (Pro/Std).
        </p>
      ) : null}
    </div>
  );
}
