"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, Clapperboard, ImageIcon, Star } from "lucide-react";

import { composerModelDisplayLabel } from "@/lib/composer-model-label";
import {
  buildStudioDeepLink,
  type ZorixaStudioAction
} from "@/lib/zorixa-assistant-studio-action";
import { cn } from "@/lib/utils";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < rating ? "fill-amber-400 text-amber-400" : "text-white/20"
          )}
        />
      ))}
    </div>
  );
}

export function StudioActionCard({
  action,
  onUseInStudio
}: {
  action: ZorixaStudioAction;
  onUseInStudio?: () => void;
}) {
  const router = useRouter();
  const modelLabel = composerModelDisplayLabel(
    action.modelId,
    action.type === "image" ? "image" : "video"
  );
  const href = buildStudioDeepLink(action);
  const rating = action.rating ?? 5;
  const why =
    action.why ||
    (action.type === "video"
      ? "Strong fit for this creative brief in Video Studio."
      : "Strong fit for this creative brief in Image Studio.");

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[#8338eb]/40 bg-gradient-to-b from-[#1a1228]/90 to-[#0d0d14] shadow-[0_0_28px_rgba(131,56,235,0.2)]">
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2.5">
        {action.type === "image" ? (
          <ImageIcon className="size-3.5 text-[#9b5cf6]" />
        ) : (
          <Clapperboard className="size-3.5 text-[#9b5cf6]" />
        )}
        <span className="font-display text-[11px] font-semibold uppercase tracking-wide text-[#c4b5fd]">
          Recommended Model
        </span>
      </div>

      <div className="space-y-3 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-semibold text-white">{modelLabel}</p>
            {action.durationSeconds ? (
              <p className="mt-0.5 text-xs text-white/45">{action.durationSeconds}s · {action.tab ?? "Text to Video"}</p>
            ) : action.tab ? (
              <p className="mt-0.5 text-xs text-white/45">{action.tab}</p>
            ) : null}
          </div>
          <Stars rating={rating} />
        </div>

        <div className="rounded-lg border border-white/5 bg-black/30 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Why?</p>
          <p className="mt-1 text-[13px] leading-relaxed text-white/80">{why}</p>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">Prompt</p>
          <p className="rounded-lg bg-black/35 p-2.5 text-[12px] leading-relaxed text-white/85">
            {action.prompt.length > 220 ? `${action.prompt.slice(0, 220)}…` : action.prompt}
          </p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => {
            onUseInStudio?.();
            router.push(href);
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-3 py-2.5",
            "font-display text-sm font-semibold text-white transition hover:bg-[#1d4ed8]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338eb]/50"
          )}
        >
          Use in {action.type === "image" ? "Image" : "Video"} Studio
          <ArrowUpRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
