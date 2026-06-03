/**
 * Google Gemini Omni Flash Developer video models on Atlas Cloud.
 * @see https://www.atlascloud.ai/models/google/gemini-omni-flash/text-to-video-developer
 * @see https://www.atlascloud.ai/models/google/gemini-omni-flash/image-to-video-developer
 * @see https://www.atlascloud.ai/models/google/gemini-omni-flash/reference-to-video-developer
 */

export const GEMINI_OMNI_FLASH_T2V_COMPOSER_ID = "gemini-omni-flash-t2v" as const;
export const GEMINI_OMNI_FLASH_I2V_COMPOSER_ID = "gemini-omni-flash-i2v" as const;
export const GEMINI_OMNI_FLASH_R2V_COMPOSER_ID = "gemini-omni-flash-r2v" as const;

export const GEMINI_OMNI_FLASH_MAX_IMAGES = 5;
export const GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS = 1;
export const GEMINI_OMNI_FLASH_DURATION_OPTIONS = [4, 6, 8, 10] as const;
export const GEMINI_OMNI_FLASH_REFERENCE_DURATION_OPTIONS = [6, 8, 10] as const;
export const GEMINI_OMNI_FLASH_ASPECT_OPTIONS = ["16:9", "9:16"] as const;
export const GEMINI_OMNI_FLASH_RESOLUTION_OPTIONS = [
  { id: "4k" as const, label: "4K", newBadge: true },
  { id: "1080p" as const, label: "1080p", newBadge: false },
  { id: "720p" as const, label: "720p", newBadge: false }
];

export type GeminiOmniFlashComposerId =
  | typeof GEMINI_OMNI_FLASH_T2V_COMPOSER_ID
  | typeof GEMINI_OMNI_FLASH_I2V_COMPOSER_ID
  | typeof GEMINI_OMNI_FLASH_R2V_COMPOSER_ID;

export function isGeminiOmniFlashComposerId(id: string): id is GeminiOmniFlashComposerId {
  return (
    id === GEMINI_OMNI_FLASH_T2V_COMPOSER_ID ||
    id === GEMINI_OMNI_FLASH_I2V_COMPOSER_ID ||
    id === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID
  );
}

export function geminiOmniFlashComposerSupportsAction(id: string, actionTab: string): boolean {
  if (id === GEMINI_OMNI_FLASH_T2V_COMPOSER_ID) return actionTab === "Text to Video";
  if (id === GEMINI_OMNI_FLASH_I2V_COMPOSER_ID) return actionTab === "Image to Video";
  if (id === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID) return actionTab === "Reference to Video";
  return false;
}

export function isGeminiOmniFlashAtlasModel(model: string): boolean {
  return /google\/gemini-omni-flash\/(text-to-video|image-to-video|reference-to-video)-developer/i.test(
    model
  );
}

export function isGeminiOmniFlashTextAtlasModel(model: string): boolean {
  return /google\/gemini-omni-flash\/text-to-video-developer/i.test(model);
}

export function isGeminiOmniFlashImageAtlasModel(model: string): boolean {
  return /google\/gemini-omni-flash\/image-to-video-developer/i.test(model);
}

export function isGeminiOmniFlashReferenceAtlasModel(model: string): boolean {
  return /google\/gemini-omni-flash\/reference-to-video-developer/i.test(model);
}

export function normalizeGeminiOmniFlashDurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 8;
  const rounded = Math.round(raw);
  return GEMINI_OMNI_FLASH_DURATION_OPTIONS.reduce((best, option) =>
    Math.abs(option - rounded) < Math.abs(best - rounded) ? option : best
  );
}

export function normalizeGeminiOmniFlashReferenceDurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 8;
  const rounded = Math.round(raw);
  return GEMINI_OMNI_FLASH_REFERENCE_DURATION_OPTIONS.reduce((best, option) =>
    Math.abs(option - rounded) < Math.abs(best - rounded) ? option : best
  );
}

export function geminiOmniFlashAspectFromUi(raw: string): (typeof GEMINI_OMNI_FLASH_ASPECT_OPTIONS)[number] {
  const v = raw.trim();
  return (GEMINI_OMNI_FLASH_ASPECT_OPTIONS as readonly string[]).includes(v)
    ? (v as (typeof GEMINI_OMNI_FLASH_ASPECT_OPTIONS)[number])
    : "16:9";
}

export function geminiOmniFlashResolutionFromUi(raw: string): "720p" | "1080p" | "4k" {
  const v = raw.trim().toLowerCase();
  if (v === "4k" || v === "2160p") return "4k";
  if (v === "1080p") return "1080p";
  return "720p";
}

export function buildGeminiOmniFlashAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  images?: string[];
  videoUrl?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    aspect_ratio: geminiOmniFlashAspectFromUi(input.aspectRatio),
    resolution: geminiOmniFlashResolutionFromUi(input.resolution),
    duration: isGeminiOmniFlashReferenceAtlasModel(input.model)
      ? normalizeGeminiOmniFlashReferenceDurationSeconds(input.durationSec)
      : normalizeGeminiOmniFlashDurationSeconds(input.durationSec),
    seed: -1
  };

  const images = (input.images ?? []).slice(0, GEMINI_OMNI_FLASH_MAX_IMAGES);
  if (images.length > 0) body.images = images;

  if (isGeminiOmniFlashReferenceAtlasModel(input.model) && input.videoUrl) {
    body.video_clips = [{ url: input.videoUrl }];
  }

  return body;
}
