/**
 * Maps Zorixa image composer IDs → Atlas Cloud `generateImage` `model` slugs.
 * @see https://www.atlascloud.ai/models/list
 */
export type AtlasImageRouteAction = "text" | "edit";

type AtlasImageModelRow = {
  text: string;
  edit: string;
  /** Max reference / output slots in the image bottom bar. */
  maxImages: number;
  /** Default GENERATE batch count when switching to this model. */
  defaultBatch: number;
};

export const ATLAS_IMAGE_MODEL_MAP: Record<string, AtlasImageModelRow> = {
  "gpt-image-2": {
    text: "openai/gpt-image-2/text-to-image",
    edit: "openai/gpt-image-2/edit",
    maxImages: 16,
    defaultBatch: 16
  },
  "nano-banana-2": {
    text: "google/nano-banana-2/text-to-image",
    edit: "google/nano-banana-2/edit",
    maxImages: 14,
    defaultBatch: 1
  },
  "nano-banana": {
    text: "google/nano-banana/text-to-image",
    edit: "google/nano-banana/edit",
    maxImages: 8,
    defaultBatch: 1
  },
  /** In-house slot (replaces legacy Enhancor) — Atlas Qwen Image stack. */
  zorixa: {
    text: "atlascloud/qwen-image/text-to-image",
    edit: "atlascloud/qwen-image/edit",
    maxImages: 4,
    defaultBatch: 1
  },
  "seedream-5": {
    text: "bytedance/seedream-v5.0-lite",
    edit: "bytedance/seedream-v5.0-lite/edit",
    maxImages: 10,
    defaultBatch: 1
  },
  "grok-imagine": {
    text: "xai/grok-imagine-image-quality/text-to-image",
    edit: "xai/grok-imagine-image-quality/edit",
    maxImages: 1,
    defaultBatch: 1
  }
};

export const ATLAS_IMAGE_COMPOSER_IDS = Object.keys(ATLAS_IMAGE_MODEL_MAP);

export function isAtlasImageComposerId(id: string): boolean {
  return id in ATLAS_IMAGE_MODEL_MAP;
}

export function getAtlasImageModelLimits(id: string): { maxImages: number; defaultBatch: number } {
  const row = ATLAS_IMAGE_MODEL_MAP[id];
  if (!row) return { maxImages: 1, defaultBatch: 1 };
  return { maxImages: row.maxImages, defaultBatch: row.defaultBatch };
}

/** Text-to-image vs image-to-image (edit) from whether the user attached references. */
export function resolveAtlasImageModelId(
  composerModelId: string,
  hasReferenceImages: boolean
): string | null {
  const row = ATLAS_IMAGE_MODEL_MAP[composerModelId];
  if (!row) return null;
  return hasReferenceImages ? row.edit : row.text;
}
