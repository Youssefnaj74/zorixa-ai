/**
 * Kling v3.0 Pro / Std on Atlas Cloud — text & image to video.
 * @see https://www.atlascloud.ai/models/kwaivgi/kling-v3.0-pro/text-to-video
 * @see https://www.atlascloud.ai/models/kwaivgi/kling-v3.0-pro/image-to-video
 */

export const KLING_V3_COMPOSER_ID = "kling-3-pro" as const;

export const KLING_V3_ASPECT_OPTIONS = ["16:9", "9:16", "1:1"] as const;

/** Atlas Cloud playground — 3s through 15s (T2V + I2V). */
export const KLING_V3_MIN_DURATION_SECONDS = 3;

export const KLING_V3_MAX_DURATION_SECONDS = 15;

export const KLING_V3_DURATION_OPTIONS = Array.from(
  { length: KLING_V3_MAX_DURATION_SECONDS - KLING_V3_MIN_DURATION_SECONDS + 1 },
  (_, i) => KLING_V3_MIN_DURATION_SECONDS + i
);

export function isKling30ProComposerId(id: string): boolean {
  return id === KLING_V3_COMPOSER_ID;
}

export function isKlingV3AtlasModel(model: string): boolean {
  return /kwaivgi\/kling-v3\.0-(pro|std)\/(text-to-video|image-to-video)/i.test(model);
}

export function isKlingV3ImageToVideoModel(model: string): boolean {
  return /kwaivgi\/kling-v3\.0-(pro|std)\/image-to-video/i.test(model);
}

export function klingV3AspectFromUi(raw: string): (typeof KLING_V3_ASPECT_OPTIONS)[number] {
  const v = raw.trim();
  return (KLING_V3_ASPECT_OPTIONS as readonly string[]).includes(v)
    ? (v as (typeof KLING_V3_ASPECT_OPTIONS)[number])
    : "16:9";
}

export function normalizeKlingV3DurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 5;
  return Math.min(
    KLING_V3_MAX_DURATION_SECONDS,
    Math.max(KLING_V3_MIN_DURATION_SECONDS, Math.round(raw))
  );
}

export function klingV3DurationOptionsForUi(): number[] {
  return [...KLING_V3_DURATION_OPTIONS];
}

export function klingV3AspectOptionsForUi(): readonly string[] {
  return KLING_V3_ASPECT_OPTIONS;
}

/** Atlas I2V supports optional `end_image` (Zorixa: end frame slot). */
export function kling30ProComposerSupportsEndFrame(composerModelId: string): boolean {
  return isKling30ProComposerId(composerModelId);
}

export function buildKlingV3AtlasBody(input: {
  model: string;
  prompt: string;
  durationSec: number;
  aspectRatio?: string;
  imageUrl?: string;
  endImageUrl?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    duration: normalizeKlingV3DurationSeconds(input.durationSec),
    fps: 24
  };

  const imageUrl = input.imageUrl?.trim();
  if (imageUrl) {
    body.image = imageUrl;
    body.image_url = imageUrl;
  }

  const endImage = input.endImageUrl?.trim();
  if (endImage) {
    body.end_image = endImage;
  }

  if (input.aspectRatio) {
    body.aspect_ratio = klingV3AspectFromUi(input.aspectRatio);
  }

  return body;
}
