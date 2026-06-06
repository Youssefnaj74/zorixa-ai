import type { DirectorQualityPreset } from "@/lib/ai-director/types";

export {
  DIRECTOR_GENERATION_CANCEL_MESSAGE,
  DIRECTOR_SLOW_GENERATION_SEC,
  formatDirectorElapsed,
  VIDEO_GENERATION_CANCEL_MESSAGE,
  VIDEO_SLOW_GENERATION_SEC
} from "@/lib/video-generation-progress";

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
