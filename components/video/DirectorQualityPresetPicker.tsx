"use client";

import { cn } from "@/lib/utils";
import {
  DIRECTOR_QUALITY_PRESETS,
  type DirectorQualityPreset
} from "@/lib/ai-director/types";

const PRESET_LABELS: Record<DirectorQualityPreset, string> = {
  fast: "Fast",
  balanced: "Balanced ⭐",
  best: "Best Quality"
};

export function DirectorQualityPresetPicker({
  value,
  onChange,
  className
}: {
  value: DirectorQualityPreset;
  onChange: (preset: DirectorQualityPreset) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-medium text-white/50">Quality</span>
      {DIRECTOR_QUALITY_PRESETS.map((preset) => {
        const active = value === preset;
        return (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-[#3a86ff]/60 bg-[#3a86ff]/15 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
            )}
          >
            {PRESET_LABELS[preset]}
          </button>
        );
      })}
    </div>
  );
}
