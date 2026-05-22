/**
 * Google Veo 3.1 — Atlas Cloud video models.
 * Reference-to-video: up to 3 images, 8s, 720p / 1080p.
 * @see https://www.atlascloud.ai/docs/en/more-models/google/veo3.1-reference-to-video/generateVideo
 */

export const VEO_31_COMPOSER_ID = "google-veo-3-1" as const;

/** Atlas Veo 3.1 reference-to-video image slot limit. */
export const VEO_31_REFERENCE_TO_VIDEO_MAX_IMAGES = 3;

/** Reference-to-video output length on Atlas (fixed). */
export const VEO_31_REFERENCE_DURATION_SECONDS = 8;

const ATLAS_T2V = "google/veo3.1/text-to-video";
const ATLAS_I2V = "google/veo3.1/image-to-video";
const ATLAS_R2V = "google/veo3.1/reference-to-video";

export type Veo31AtlasAction = "text" | "image" | "reference";

export function isVeo31ComposerId(id: string): boolean {
  return id === VEO_31_COMPOSER_ID;
}

export function isVeo31AtlasModel(model: string): boolean {
  return /google\/veo3\.1\/(text-to-video|image-to-video|reference-to-video|fast)/i.test(
    model
  );
}

export function isVeo31ReferenceToVideoModel(model: string): boolean {
  return /google\/veo3\.1\/reference-to-video/i.test(model);
}

/** Atlas API expects lowercase 720p / 1080p for Veo 3.1 R2V. */
export function veo31ResolutionFromUi(raw: string): "720p" | "1080p" {
  const v = raw.trim().toLowerCase();
  if (v === "1080p" || v === "1080") return "1080p";
  return "720p";
}

export function normalizeVeo31ReferenceDurationSeconds(_raw?: unknown): number {
  return VEO_31_REFERENCE_DURATION_SECONDS;
}

export function buildVeo31ReferenceAtlasBody(input: {
  model: string;
  prompt: string;
  images: string[];
  resolution: string;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const images = input.images.slice(0, VEO_31_REFERENCE_TO_VIDEO_MAX_IMAGES);
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    images,
    resolution: veo31ResolutionFromUi(input.resolution),
    duration: VEO_31_REFERENCE_DURATION_SECONDS
  };
  if (input.generateAudio === true) {
    body.generate_audio = true;
  } else if (input.generateAudio === false) {
    body.generate_audio = false;
  }
  return body;
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
