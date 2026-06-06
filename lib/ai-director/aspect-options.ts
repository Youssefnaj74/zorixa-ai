import {
  GROK_IMAGINE_VIDEO_ASPECT_OPTIONS,
  isGrokImagineVideoComposerId
} from "@/lib/atlas-grok-video";
import { isKling30ProComposerId, KLING_V3_ASPECT_OPTIONS } from "@/lib/atlas-kling-v3-video";
import type { DirectorResolvedStyle, DirectorStyleInput } from "@/lib/ai-director/types";

/** AI Director aspect choices — compact set for ads / social / cinematic. */
export const DIRECTOR_ASPECT_OPTIONS = ["9:16", "16:9", "1:1"] as const;

export type DirectorAspectRatio = (typeof DIRECTOR_ASPECT_OPTIONS)[number];

export const DIRECTOR_LAUNCH_DEFAULT_ASPECT: DirectorAspectRatio = "9:16";

export function directorDefaultAspectForStyle(
  style: DirectorStyleInput | DirectorResolvedStyle
): DirectorAspectRatio {
  if (style === "ugc" || style === "auto") return "9:16";
  if (style === "product") return "1:1";
  return "16:9";
}

function modelAllowsAspect(modelId: string, aspect: DirectorAspectRatio): boolean {
  if (modelId === "google-veo-3-1") {
    return aspect === "16:9" || aspect === "9:16";
  }
  if (isGrokImagineVideoComposerId(modelId)) {
    return (GROK_IMAGINE_VIDEO_ASPECT_OPTIONS as readonly string[]).includes(aspect);
  }
  if (isKling30ProComposerId(modelId)) {
    return (KLING_V3_ASPECT_OPTIONS as readonly string[]).includes(aspect);
  }
  return true;
}

export function getDirectorAspectOptions(modelId: string): DirectorAspectRatio[] {
  const allowed = DIRECTOR_ASPECT_OPTIONS.filter((aspect) => modelAllowsAspect(modelId, aspect));
  return allowed.length > 0 ? allowed : [...DIRECTOR_ASPECT_OPTIONS];
}

export function clampDirectorAspectToOptions(
  options: readonly DirectorAspectRatio[],
  current: string
): DirectorAspectRatio {
  if (options.length === 0) return DIRECTOR_LAUNCH_DEFAULT_ASPECT;
  if (options.includes(current as DirectorAspectRatio)) {
    return current as DirectorAspectRatio;
  }
  return options[0];
}
