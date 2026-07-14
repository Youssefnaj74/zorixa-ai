/**
 * xAI Grok Imagine Video models on Atlas Cloud.
 * @see https://www.atlascloud.ai/models/xai/grok-imagine-video/text-to-video
 * @see https://www.atlascloud.ai/models/xai/grok-imagine-video-v1.5/image-to-video
 * @see https://www.atlascloud.ai/models/xai/grok-imagine-video/reference-to-video
 */

export const GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID = "grok-imagine-video-t2v" as const;
export const GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID = "grok-imagine-video-i2v-15" as const;
export const GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID = "grok-imagine-video-r2v" as const;

export const GROK_IMAGINE_VIDEO_MAX_REFERENCE_IMAGES = 7;
export const GROK_IMAGINE_VIDEO_DURATION_OPTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
] as const;
export const GROK_IMAGINE_VIDEO_REFERENCE_DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const GROK_IMAGINE_VIDEO_ASPECT_OPTIONS = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
  "3:2",
  "2:3"
] as const;
export const GROK_IMAGINE_VIDEO_RESOLUTION_OPTIONS = [
  { id: "720p" as const, label: "720p", newBadge: false },
  { id: "480p" as const, label: "480p", newBadge: false }
];

export type GrokImagineVideoComposerId =
  | typeof GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID
  | typeof GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID
  | typeof GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID;

export function isGrokImagineVideoComposerId(id: string): id is GrokImagineVideoComposerId {
  return (
    id === GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID ||
    id === GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID ||
    id === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID
  );
}

export function grokImagineVideoComposerSupportsAction(id: string, actionTab: string): boolean {
  if (id === GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID) return actionTab === "Text to Video";
  if (id === GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID) return actionTab === "Image to Video";
  if (id === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID) return actionTab === "Reference to Video";
  return false;
}

export function isGrokImagineVideoAtlasModel(model: string): boolean {
  return /xai\/grok-imagine-video(-v1\.5)?\/(text-to-video|image-to-video|reference-to-video)/i.test(
    model
  );
}

export function isGrokImagineVideoTextAtlasModel(model: string): boolean {
  return /xai\/grok-imagine-video\/text-to-video/i.test(model);
}

export function isGrokImagineVideoImageAtlasModel(model: string): boolean {
  return /xai\/grok-imagine-video-v1\.5\/image-to-video/i.test(model);
}

export function isGrokImagineVideoReferenceAtlasModel(model: string): boolean {
  return /xai\/grok-imagine-video\/reference-to-video/i.test(model);
}

export function normalizeGrokImagineVideoDurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 5;
  return Math.min(15, Math.max(1, Math.round(raw)));
}

export function normalizeGrokImagineVideoReferenceDurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 5;
  return Math.min(10, Math.max(1, Math.round(raw)));
}

export function grokImagineVideoAspectFromUi(raw: string): (typeof GROK_IMAGINE_VIDEO_ASPECT_OPTIONS)[number] {
  const v = raw.trim();
  return (GROK_IMAGINE_VIDEO_ASPECT_OPTIONS as readonly string[]).includes(v)
    ? (v as (typeof GROK_IMAGINE_VIDEO_ASPECT_OPTIONS)[number])
    : "9:16";
}

export function grokImagineVideoResolutionFromUi(raw: string): "480p" | "720p" {
  const v = raw.trim().toLowerCase();
  return v === "480p" ? "480p" : "720p";
}

export function buildGrokImagineVideoAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  imageUrl?: string;
  referenceImages?: string[];
}): Record<string, unknown> {
  const isReference = isGrokImagineVideoReferenceAtlasModel(input.model);
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    duration: isReference
      ? normalizeGrokImagineVideoReferenceDurationSeconds(input.durationSec)
      : normalizeGrokImagineVideoDurationSeconds(input.durationSec),
    aspect_ratio: grokImagineVideoAspectFromUi(input.aspectRatio),
    resolution: grokImagineVideoResolutionFromUi(input.resolution)
  };

  if (input.imageUrl) {
    body.image_url = input.imageUrl;
  }

  // Atlas R2V expects `image_urls` (not Seedance-style `reference_images`).
  const refs = (input.referenceImages ?? []).slice(0, GROK_IMAGINE_VIDEO_MAX_REFERENCE_IMAGES);
  if (isReference && refs.length > 0) {
    body.image_urls = refs;
  }

  return body;
}
