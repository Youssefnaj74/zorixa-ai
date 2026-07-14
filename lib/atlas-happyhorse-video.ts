/**
 * Alibaba HappyHorse 1.0 — text / image / reference / video-edit on Atlas Cloud.
 * @see https://www.atlascloud.ai/models/alibaba/happyhorse-1.0/text-to-video
 * @see https://www.atlascloud.ai/models/alibaba/happyhorse-1.0/image-to-video
 * @see https://www.atlascloud.ai/models/alibaba/happyhorse-1.0/reference-to-video
 * @see https://www.atlascloud.ai/models/alibaba/happyhorse-1.0/video-edit
 */

/** Atlas HappyHorse reference-to-video image slot limit (`images`, 1–9). */
export const HAPPYHORSE_REFERENCE_TO_VIDEO_MAX_IMAGES = 9;

/** Atlas HappyHorse video-edit (V2V) optional reference image limit. */
export const HAPPYHORSE_VIDEO_EDIT_MAX_IMAGES = 5;

export const HAPPYHORSE_1_COMPOSER_ID = "happyhorse-1" as const;

export const HAPPYHORSE_ASPECT_OPTIONS = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;

const ATLAS_T2V = "alibaba/happyhorse-1.0/text-to-video";
const ATLAS_I2V = "alibaba/happyhorse-1.0/image-to-video";
const ATLAS_R2V = "alibaba/happyhorse-1.0/reference-to-video";
const ATLAS_V2V = "alibaba/happyhorse-1.0/video-edit";

export type HappyHorseAtlasAction = "text" | "image" | "reference" | "edit";

export function isHappyHorseComposerId(id: string): boolean {
  return id === HAPPYHORSE_1_COMPOSER_ID;
}

export function isHappyHorseAtlasModel(model: string): boolean {
  return /alibaba\/happyhorse-1\.0\/(text-to-video|image-to-video|reference-to-video|video-edit)/i.test(
    model
  );
}

export function isHappyHorseTextToVideoModel(model: string): boolean {
  return /alibaba\/happyhorse-1\.0\/text-to-video/i.test(model);
}

export function isHappyHorseImageToVideoModel(model: string): boolean {
  return /alibaba\/happyhorse-1\.0\/image-to-video/i.test(model);
}

export function isHappyHorseReferenceToVideoModel(model: string): boolean {
  return /alibaba\/happyhorse-1\.0\/reference-to-video/i.test(model);
}

export function isHappyHorseVideoEditModel(model: string): boolean {
  return /alibaba\/happyhorse-1\.0\/video-edit/i.test(model);
}

/** Atlas expects 720P / 1080P (not 720p). */
export function happyHorseResolutionFromUi(raw: string): "720P" | "1080P" {
  const v = raw.trim().toLowerCase();
  if (v === "1080p" || v === "1080") return "1080P";
  return "720P";
}

/** Atlas T2V / R2V use `ratio` (not `aspect_ratio`). I2V has no ratio field. */
export function happyHorseRatioFromUi(raw: string): (typeof HAPPYHORSE_ASPECT_OPTIONS)[number] {
  const v = raw.trim();
  return (HAPPYHORSE_ASPECT_OPTIONS as readonly string[]).includes(v)
    ? (v as (typeof HAPPYHORSE_ASPECT_OPTIONS)[number])
    : "16:9";
}

/** T2V / I2V / R2V — 3–15 seconds on Atlas. */
export function normalizeHappyHorseDurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 5;
  return Math.min(15, Math.max(3, Math.round(raw)));
}

/**
 * Build Atlas body for HappyHorse T2V / I2V / R2V.
 * Field names follow Atlas schema exactly (images + ratio for R2V; image for I2V; no fps).
 */
export function buildHappyHorseAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  imageUrl?: string;
  referenceImages?: string[];
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    resolution: happyHorseResolutionFromUi(input.resolution),
    duration: normalizeHappyHorseDurationSeconds(input.durationSec)
  };

  if (isHappyHorseReferenceToVideoModel(input.model)) {
    // Atlas R2V: images (required 1–9) + ratio — not reference_images / aspect_ratio / fps
    body.ratio = happyHorseRatioFromUi(input.aspectRatio);
    const images = (input.referenceImages ?? []).slice(
      0,
      HAPPYHORSE_REFERENCE_TO_VIDEO_MAX_IMAGES
    );
    if (images.length > 0) body.images = images;
    return body;
  }

  if (isHappyHorseImageToVideoModel(input.model)) {
    // Atlas I2V: image only (no ratio / fps / image_url alias)
    if (input.imageUrl) body.image = input.imageUrl;
    return body;
  }

  // Atlas T2V: ratio — not aspect_ratio / fps
  body.ratio = happyHorseRatioFromUi(input.aspectRatio);
  return body;
}

/** Video-edit — prompt + video + optional images + resolution only (no aspect/duration on Atlas). */
export function buildHappyHorseVideoEditAtlasBody(input: {
  model: string;
  prompt: string;
  resolution: string;
  videoUrl: string;
  referenceImages?: string[];
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    video: input.videoUrl,
    video_url: input.videoUrl,
    resolution: happyHorseResolutionFromUi(input.resolution)
  };
  const refs = (input.referenceImages ?? []).slice(0, HAPPYHORSE_VIDEO_EDIT_MAX_IMAGES);
  if (refs.length > 0) {
    body.images = refs;
  }
  return body;
}

export function resolveHappyHorseAtlasSlug(action: HappyHorseAtlasAction): string {
  switch (action) {
    case "image":
      return ATLAS_I2V;
    case "reference":
      return ATLAS_R2V;
    case "edit":
      return ATLAS_V2V;
    default:
      return ATLAS_T2V;
  }
}
