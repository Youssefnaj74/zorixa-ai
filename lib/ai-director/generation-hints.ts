import type { DirectorQualityPreset } from "@/lib/ai-director/types";

export function formatDirectorElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function directorTypicalTimeHint(qualityPreset: DirectorQualityPreset): string {
  switch (qualityPreset) {
    case "best":
      return "5–10 min for Best Quality";
    case "fast":
      return "1–3 min for Fast";
    default:
      return "2–5 min for UGC & Balanced";
  }
}

export const DIRECTOR_GENERATION_CANCEL_MESSAGE =
  "Generation cancelled.\n\nIf Atlas already started processing, credits may have been consumed.\nCheck History for completed outputs.";

/** Show "taking longer" banner after this many seconds. */
export const DIRECTOR_SLOW_GENERATION_SEC = 5 * 60;
