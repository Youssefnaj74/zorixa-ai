"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DIRECTOR_STYLE_OPTIONS,
  type DirectorStyleInput
} from "@/lib/ai-director/types";

const STYLE_LABELS: Record<DirectorStyleInput, string> = {
  auto: "Auto",
  cinematic: "Cinematic",
  ugc: "UGC",
  product: "Product",
  anime: "Anime"
};

export function DirectorStylePicker({
  value,
  onChange,
  className
}: {
  value: DirectorStyleInput;
  onChange: (style: DirectorStyleInput) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="flex items-center gap-1 text-xs font-medium text-white/50">
        <Sparkles className="size-3.5 text-[#c084fc]" aria-hidden />
        Style
      </span>
      {DIRECTOR_STYLE_OPTIONS.map((style) => {
        const active = value === style;
        return (
          <button
            key={style}
            type="button"
            onClick={() => onChange(style)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-[#8338eb]/60 bg-[#8338eb]/20 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
            )}
          >
            {style === "auto" ? "Auto ⭐" : STYLE_LABELS[style]}
          </button>
        );
      })}
    </div>
  );
}
