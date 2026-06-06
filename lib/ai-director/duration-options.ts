import {
  HAILUO_23_I2V_DURATION_OPTIONS,
  HAILUO_23_T2V_DURATION_SECONDS,
  isHailuo23ComposerId,
  normalizeHailuo23I2vDurationSeconds
} from "@/lib/atlas-hailuo-video";
import {
  GROK_IMAGINE_VIDEO_DURATION_OPTIONS,
  isGrokImagineVideoComposerId,
  normalizeGrokImagineVideoDurationSeconds
} from "@/lib/atlas-grok-video";
import {
  isKling30ProComposerId,
  normalizeKlingV3DurationSeconds
} from "@/lib/atlas-kling-v3-video";
import {
  isViduQ3ComposerId,
  isViduQ3ProComposerId,
  normalizeViduDurationSeconds
} from "@/lib/atlas-vidu-video";
import {
  normalizeVeo31DurationSeconds,
  VEO_31_DURATION_OPTIONS
} from "@/lib/atlas-veo31-video";
import type { DirectorResolvedStyle, DirectorRouteAction } from "@/lib/ai-director/types";

const DEFAULT_T2V_OPTIONS = [5, 6, 8, 10, 15] as const;

/** UI duration chips for the routed model + T2V/I2V. */
export function getDirectorDurationOptions(
  modelId: string,
  routeAction: DirectorRouteAction
): number[] {
  if (isHailuo23ComposerId(modelId)) {
    return routeAction === "image"
      ? [...HAILUO_23_I2V_DURATION_OPTIONS]
      : [HAILUO_23_T2V_DURATION_SECONDS];
  }
  if (isGrokImagineVideoComposerId(modelId)) {
    const allowed = new Set<number>(GROK_IMAGINE_VIDEO_DURATION_OPTIONS);
    return DEFAULT_T2V_OPTIONS.filter((d) => allowed.has(d));
  }
  if (isKling30ProComposerId(modelId)) {
    return [5, 6, 8, 10, 15];
  }
  if (isViduQ3ComposerId(modelId) || isViduQ3ProComposerId(modelId)) {
    return [5, 6, 8, 10, 15];
  }
  if (modelId === "google-veo-3-1") {
    return [...VEO_31_DURATION_OPTIONS];
  }
  return [...DEFAULT_T2V_OPTIONS];
}

export function normalizeDirectorDurationSeconds(
  modelId: string,
  routeAction: DirectorRouteAction,
  raw: number
): number {
  if (isHailuo23ComposerId(modelId)) {
    return routeAction === "image"
      ? normalizeHailuo23I2vDurationSeconds(raw)
      : HAILUO_23_T2V_DURATION_SECONDS;
  }
  if (isGrokImagineVideoComposerId(modelId)) {
    return normalizeGrokImagineVideoDurationSeconds(raw);
  }
  if (isKling30ProComposerId(modelId)) {
    return normalizeKlingV3DurationSeconds(raw);
  }
  if (isViduQ3ComposerId(modelId) || isViduQ3ProComposerId(modelId)) {
    return normalizeViduDurationSeconds(raw);
  }
  if (modelId === "google-veo-3-1") {
    return normalizeVeo31DurationSeconds(raw, "720p");
  }
  if (!Number.isFinite(raw)) return 5;
  return Math.min(15, Math.max(5, Math.round(raw)));
}

export function clampDirectorDurationToOptions(options: number[], current: number): number {
  if (options.length === 0) return 5;
  if (options.includes(current)) return current;
  return options.reduce((best, option) =>
    Math.abs(option - current) < Math.abs(best - current) ? option : best
  );
}

/** Launch defaults: UGC/product ads need more time; cinematic/anime clips stay short. */
export const DIRECTOR_LAUNCH_DEFAULT_DURATION_SEC = 8;

export function directorDefaultDurationForStyle(style: DirectorResolvedStyle): number {
  return style === "ugc" || style === "product" ? 8 : 5;
}
