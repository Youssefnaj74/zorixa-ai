/**
 * Alibaba HappyHorse 1.0 — text-to-video & image-to-video on Atlas Cloud.
 * @see https://www.atlascloud.ai/models/alibaba/happyhorse-1.0/text-to-video
 */

export const HAPPYHORSE_1_COMPOSER_ID = "happyhorse-1" as const;

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

/** HappyHorse supports 3–15 second clips. */
export function normalizeHappyHorseDurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 5;
  return Math.min(15, Math.max(3, Math.round(raw)));
}

export function buildHappyHorseAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  imageUrl?: string;
  videoUrl?: string;
  referenceImages?: string[];
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    resolution: happyHorseResolutionFromUi(input.resolution),
    duration: normalizeHappyHorseDurationSeconds(input.durationSec),
    fps: 24
  };
  if (input.imageUrl) {
    body.image_url = input.imageUrl;
    body.image = input.imageUrl;
  }
  if (input.videoUrl) {
    body.video_url = input.videoUrl;
    body.video = input.videoUrl;
  }
  if (input.referenceImages && input.referenceImages.length > 0) {
    body.reference_images = input.referenceImages;
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
