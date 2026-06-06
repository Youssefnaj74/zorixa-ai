import type { ActionTab } from "@/components/video/ActionTabsRow";
import type { DirectorQualityPreset } from "@/lib/ai-director/types";

export function formatVideoElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** @deprecated Use formatVideoElapsed */
export const formatDirectorElapsed = formatVideoElapsed;

export type VideoGenStageStatus = "done" | "active" | "pending";

export type VideoGenStage = {
  label: string;
  status: VideoGenStageStatus;
};

/** Stage checklist — no fake percentages; reveals steps over elapsed time. */
export function videoGenerationStages(
  elapsedSec: number,
  directorRouted: boolean
): VideoGenStage[] {
  const modelStepLabel = directorRouted
    ? "AI Director selected the best model"
    : "Model selected";

  const stages: VideoGenStage[] = [{ label: "Prompt analyzed", status: "done" }];

  if (elapsedSec >= 15) {
    stages.push({ label: modelStepLabel, status: "done" });
  }

  if (elapsedSec >= 30) {
    if (elapsedSec < 90) {
      stages.push({ label: "Generating video frames...", status: "active" });
    } else {
      stages.push({ label: "Frames generated", status: "done" });
    }
  }

  if (elapsedSec >= 90) {
    stages.push({ label: "Finalizing video", status: "active" });
  }

  return stages;
}

export function videoGenerationContextTip(input: {
  actionTab: ActionTab;
  directorStyle?: string | null;
  directorQualityPreset?: DirectorQualityPreset | null;
  generateAudioOn?: boolean;
  isUpscale?: boolean;
}): string {
  if (input.isUpscale) {
    return "Upscaling usually takes 1–3 minutes.";
  }

  if (input.actionTab === "AI Director") {
    if (input.directorQualityPreset === "best") {
      return "Premium quality generations can take up to 10 minutes.";
    }
    const style = (input.directorStyle ?? "").toLowerCase();
    if (style === "cinematic" || style === "anime") {
      return "Cinematic videos usually take 2–5 minutes.";
    }
    if (style === "ugc" || style === "product") {
      return "UGC videos with audio may take slightly longer.";
    }
    return "Balanced generations usually take 2–5 minutes.";
  }

  if (input.generateAudioOn) {
    return "Videos with audio may take slightly longer.";
  }

  return "Video generation usually takes 2–5 minutes.";
}

export const VIDEO_GENERATION_CANCEL_MESSAGE =
  "Generation cancelled.\n\nIf Atlas already started processing, credits may have been consumed.\nCheck History for completed outputs.";

/** @deprecated Use VIDEO_GENERATION_CANCEL_MESSAGE */
export const DIRECTOR_GENERATION_CANCEL_MESSAGE = VIDEO_GENERATION_CANCEL_MESSAGE;

/** Show optional slow banner after this many seconds (AI Director only). */
export const VIDEO_SLOW_GENERATION_SEC = 5 * 60;

/** @deprecated Use VIDEO_SLOW_GENERATION_SEC */
export const DIRECTOR_SLOW_GENERATION_SEC = VIDEO_SLOW_GENERATION_SEC;
