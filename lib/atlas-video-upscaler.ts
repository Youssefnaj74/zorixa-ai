/** Atlas Cloud video upscaler — FlashVSR V2V. @see https://www.atlascloud.ai/models/atlascloud/video-upscaler */

export const ATLAS_VIDEO_UPSCALER_COMPOSER_ID = "atlas-video-upscaler" as const;

export const ATLAS_VIDEO_UPSCALER_MODEL = "atlascloud/video-upscaler" as const;

export const ATLAS_VIDEO_UPSCALER_TARGET_OPTIONS = ["1080p", "2k"] as const;

export type AtlasVideoUpscalerTarget = (typeof ATLAS_VIDEO_UPSCALER_TARGET_OPTIONS)[number];

/** Atlas wholesale per second (1080p). 2K = $0.024/s on Atlas. */
export const ATLAS_VIDEO_UPSCALER_PER_SECOND_USD: Record<AtlasVideoUpscalerTarget, number> = {
  "1080p": 0.018,
  "2k": 0.024
};

export function isAtlasVideoUpscalerComposerId(id: string): boolean {
  return id === ATLAS_VIDEO_UPSCALER_COMPOSER_ID;
}

export function normalizeAtlasVideoUpscalerTarget(raw: unknown): AtlasVideoUpscalerTarget {
  if (typeof raw === "string" && raw.trim().toLowerCase() === "2k") return "2k";
  return "1080p";
}

export function atlasVideoUpscalerUsd(durationSeconds: number, target: AtlasVideoUpscalerTarget): number {
  const sec = Number.isFinite(durationSeconds) ? Math.max(1, Math.min(53, durationSeconds)) : 5;
  return ATLAS_VIDEO_UPSCALER_PER_SECOND_USD[target] * sec;
}

export function buildAtlasVideoUpscalerBody(input: {
  videoUrl: string;
  targetResolution?: AtlasVideoUpscalerTarget;
  copyAudio?: boolean;
}): Record<string, unknown> {
  return {
    model: ATLAS_VIDEO_UPSCALER_MODEL,
    video: input.videoUrl,
    target_resolution: input.targetResolution ?? "1080p",
    copy_audio: input.copyAudio ?? true
  };
}
