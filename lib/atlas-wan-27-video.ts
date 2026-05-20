/**
 * Alibaba Wan 2.7 — text / image / reference / video-edit on Atlas Cloud.
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.7/text-to-video
 */

export const WAN_27_COMPOSER_ID = "wan-2-7" as const;

const ATLAS_T2V = "alibaba/wan-2.7/text-to-video";
const ATLAS_I2V = "alibaba/wan-2.7/image-to-video";
const ATLAS_R2V = "alibaba/wan-2.7/reference-to-video";
const ATLAS_V2V = "alibaba/wan-2.7/video-edit";

export type Wan27AtlasAction = "text" | "image" | "reference" | "edit";

export function isWan27ComposerId(id: string): boolean {
  return id === WAN_27_COMPOSER_ID;
}

export function isWan27AtlasModel(model: string): boolean {
  return /alibaba\/wan-2\.7\/(text-to-video|image-to-video|reference-to-video|video-edit)/i.test(
    model
  );
}

export function isWan27ReferenceToVideoModel(model: string): boolean {
  return /alibaba\/wan-2\.7\/reference-to-video/i.test(model);
}

export function isWan27VideoEditModel(model: string): boolean {
  return /alibaba\/wan-2\.7\/video-edit/i.test(model);
}

/** Atlas expects 720P / 1080P (not 720p). */
export function wan27ResolutionFromUi(raw: string): "720P" | "1080P" {
  const v = raw.trim().toLowerCase();
  if (v === "1080p" || v === "1080") return "1080P";
  return "720P";
}

/** Wan 2.7 supports 2–15 second clips. */
export function normalizeWan27DurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 5;
  return Math.min(15, Math.max(2, Math.round(raw)));
}

export function buildWan27AtlasBody(input: {
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
    resolution: wan27ResolutionFromUi(input.resolution),
    duration: normalizeWan27DurationSeconds(input.durationSec),
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

export function resolveWan27AtlasSlug(action: Wan27AtlasAction): string {
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
