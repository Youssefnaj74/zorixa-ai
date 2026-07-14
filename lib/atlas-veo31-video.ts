/**
 * Google Veo 3.1 — text / image / reference on Atlas Cloud.
 * T2V & I2V: 4 / 6 / 8s, 720p / 1080p / 4k, 16:9 & 9:16.
 * R2V: 1–3 `images`, fixed 8s, 720p / 1080p / 4k, optional `generate_audio`.
 * @see https://www.atlascloud.ai/models/google/veo3.1/text-to-video
 * @see https://www.atlascloud.ai/models/google/veo3.1/image-to-video
 * @see https://www.atlascloud.ai/models/google/veo3.1/reference-to-video
 */

export const VEO_31_COMPOSER_ID = "google-veo-3-1" as const;

export const VEO_31_DURATION_OPTIONS = [4, 6, 8] as const;

export const VEO_31_ASPECT_OPTIONS = ["16:9", "9:16"] as const;

export const VEO_31_DEFAULT_DURATION_SECONDS = 8;

/** Atlas Veo 3.1 reference-to-video image slot limit. */
export const VEO_31_REFERENCE_TO_VIDEO_MAX_IMAGES = 3;

/** Reference-to-video output length on Atlas (fixed; enum is only `8`). */
export const VEO_31_REFERENCE_DURATION_SECONDS = 8;

const ATLAS_T2V = "google/veo3.1/text-to-video";
const ATLAS_I2V = "google/veo3.1/image-to-video";
const ATLAS_R2V = "google/veo3.1/reference-to-video";

export type Veo31AtlasAction = "text" | "image" | "reference";

export type Veo31DurationSeconds = (typeof VEO_31_DURATION_OPTIONS)[number];

export type Veo31Resolution = "720p" | "1080p" | "4k";

export function isVeo31ComposerId(id: string): boolean {
  return id === VEO_31_COMPOSER_ID;
}

export function isVeo31AtlasModel(model: string): boolean {
  return /google\/veo3\.1\/(text-to-video|image-to-video|reference-to-video|fast)/i.test(
    model
  );
}

export function isVeo31TextToVideoModel(model: string): boolean {
  return /google\/veo3\.1\/text-to-video/i.test(model);
}

export function isVeo31ImageToVideoModel(model: string): boolean {
  return /google\/veo3\.1\/image-to-video/i.test(model);
}

export function isVeo31ReferenceToVideoModel(model: string): boolean {
  return /google\/veo3\.1\/reference-to-video/i.test(model);
}

/** Atlas API expects lowercase 720p / 1080p / 4k. */
export function veo31ResolutionFromUi(raw: string): Veo31Resolution {
  const v = raw.trim().toLowerCase();
  if (v === "4k" || v === "2160p") return "4k";
  if (v === "1080p" || v === "1080") return "1080p";
  return "720p";
}

/** Atlas Veo 3.1 supports landscape and portrait only. */
export function veo31AspectFromUi(raw: string): (typeof VEO_31_ASPECT_OPTIONS)[number] {
  const v = raw.trim();
  return v === "9:16" ? "9:16" : "16:9";
}

/** Snap UI seconds to Atlas-allowed 4 / 6 / 8. 1080p and 4k require 8s on Veo 3.1. */
export function normalizeVeo31DurationSeconds(
  raw: number,
  resolution?: string
): Veo31DurationSeconds {
  const res = veo31ResolutionFromUi(resolution ?? "720p");
  if (res === "1080p" || res === "4k") {
    return 8;
  }
  if (!Number.isFinite(raw)) return VEO_31_DEFAULT_DURATION_SECONDS;
  const r = Math.round(raw);
  if (r <= 5) return 4;
  if (r <= 7) return 6;
  return 8;
}

export function normalizeVeo31ReferenceDurationSeconds(_raw?: unknown): number {
  return VEO_31_REFERENCE_DURATION_SECONDS;
}

export function buildVeo31TextImageAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  imageUrl?: string;
  lastImageUrl?: string;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const resolution = veo31ResolutionFromUi(input.resolution);
  const duration = normalizeVeo31DurationSeconds(input.durationSec, resolution);
  // Atlas T2V/I2V: no `fps` — aspect_ratio + duration + resolution + generate_audio.
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    duration,
    aspect_ratio: veo31AspectFromUi(input.aspectRatio),
    resolution,
    generate_audio: input.generateAudio === true
  };
  if (input.imageUrl) {
    body.image = input.imageUrl;
  }
  if (input.lastImageUrl) {
    body.last_image = input.lastImageUrl;
  }
  return body;
}

export function buildVeo31ReferenceAtlasBody(input: {
  model: string;
  prompt: string;
  images: string[];
  resolution: string;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const images = input.images.slice(0, VEO_31_REFERENCE_TO_VIDEO_MAX_IMAGES);
  // Atlas R2V: model, prompt, images (1–3), duration=8, resolution, generate_audio.
  // No aspect_ratio / fps on this route.
  return {
    model: input.model,
    prompt: input.prompt,
    images,
    resolution: veo31ResolutionFromUi(input.resolution),
    duration: VEO_31_REFERENCE_DURATION_SECONDS,
    // Atlas default is false; always send explicitly from the studio Audio toggle.
    generate_audio: input.generateAudio === true
  };
}

export function resolveVeo31AtlasSlug(action: Veo31AtlasAction): string {
  switch (action) {
    case "image":
      return ATLAS_I2V;
    case "reference":
      return ATLAS_R2V;
    default:
      return ATLAS_T2V;
  }
}
