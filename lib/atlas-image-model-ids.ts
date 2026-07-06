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
  /** Max images per Atlas `generateImage` request (`num_images`). */
  maxBatch: number;
  /**
   * `parallel` = one Atlas job per image (Google Nano Banana — no real `num_images`).
   * `atlas` = single request with `num_images` when the provider supports it.
   */
  batchMode: "parallel" | "atlas";
};

export const ATLAS_IMAGE_MODEL_MAP: Record<string, AtlasImageModelRow> = {
  "gpt-image-2": {
    text: "openai/gpt-image-2/text-to-image",
    edit: "openai/gpt-image-2/edit",
    maxImages: 16,
    defaultBatch: 1,
    maxBatch: 1,
    batchMode: "atlas"
  },
  "nano-banana-2": {
    text: "google/nano-banana-2/text-to-image",
    edit: "google/nano-banana-2/edit",
    maxImages: 14,
    defaultBatch: 1,
    maxBatch: 4,
    batchMode: "parallel"
  },
  "nano-banana-pro": {
    text: "google/nano-banana-pro/text-to-image",
    edit: "google/nano-banana-pro/edit",
    maxImages: 14,
    defaultBatch: 1,
    maxBatch: 4,
    batchMode: "parallel"
  },
  /** Zorixa Image — Alibaba Qwen Image 2.0 Pro on Atlas Cloud. */
  zorixa: {
    text: "qwen/qwen-image-2.0-pro/text-to-image",
    edit: "qwen/qwen-image-2.0-pro/edit",
    maxImages: 4,
    defaultBatch: 1,
    maxBatch: 1,
    batchMode: "atlas"
  },
  "seedream-5": {
    text: "bytedance/seedream-v5.0-lite",
    edit: "bytedance/seedream-v5.0-lite/edit",
    maxImages: 10,
    defaultBatch: 1,
    maxBatch: 1,
    batchMode: "atlas"
  },
  "grok-imagine": {
    text: "xai/grok-imagine-image-quality/text-to-image",
    edit: "xai/grok-imagine-image-quality/edit",
    maxImages: 1,
    defaultBatch: 1,
    maxBatch: 4,
    batchMode: "parallel"
  },
  "flux-dev": {
    text: "black-forest-labs/flux-dev",
    edit: "black-forest-labs/flux-dev",
    maxImages: 1,
    defaultBatch: 1,
    maxBatch: 1,
    batchMode: "atlas"
  },
  "flux-schnell": {
    text: "black-forest-labs/flux-schnell",
    edit: "black-forest-labs/flux-schnell",
    maxImages: 1,
    defaultBatch: 1,
    maxBatch: 1,
    batchMode: "atlas"
  },
  "flux-dev-lora": {
    text: "black-forest-labs/flux-dev-lora",
    edit: "black-forest-labs/flux-dev-lora",
    maxImages: 1,
    defaultBatch: 1,
    maxBatch: 1,
    batchMode: "atlas"
  },
  "flux-kontext-dev": {
    text: "black-forest-labs/flux-kontext-dev",
    edit: "black-forest-labs/flux-kontext-dev",
    maxImages: 4,
    defaultBatch: 1,
    maxBatch: 4,
    batchMode: "atlas"
  },
  "flux-kontext-dev-lora": {
    text: "black-forest-labs/flux-kontext-dev-lora",
    edit: "black-forest-labs/flux-kontext-dev-lora",
    maxImages: 4,
    defaultBatch: 1,
    maxBatch: 4,
    batchMode: "atlas"
  },
  /** Image only — video uses composer id `wan-2-7` in ATLAS_VIDEO_MODEL_MAP. */
  "wan-image-2-7": {
    text: "alibaba/wan-2.7/text-to-image",
    edit: "alibaba/wan-2.7/image-edit",
    maxImages: 14,
    defaultBatch: 1,
    maxBatch: 4,
    batchMode: "atlas"
  },
  "wan-image-2-7-pro": {
    text: "alibaba/wan-2.7-pro/text-to-image",
    edit: "alibaba/wan-2.7-pro/image-edit",
    maxImages: 14,
    defaultBatch: 1,
    maxBatch: 4,
    batchMode: "atlas"
  },
  "wan-image-2-6": {
    text: "alibaba/wan-2.6/text-to-image",
    edit: "alibaba/wan-2.6/image-edit",
    maxImages: 14,
    defaultBatch: 1,
    maxBatch: 4,
    batchMode: "atlas"
  }
};

/** Flux text-to-image only (Atlas black-forest-labs). */
export const FLUX_TEXT_TO_IMAGE_COMPOSER_IDS = [
  "flux-dev",
  "flux-schnell",
  "flux-dev-lora"
] as const;

/** Flux image-to-image / edit (Kontext). */
export const FLUX_IMAGE_TO_IMAGE_COMPOSER_IDS = [
  "flux-kontext-dev",
  "flux-kontext-dev-lora"
] as const;

const FLUX_T2I_SET = new Set<string>(FLUX_TEXT_TO_IMAGE_COMPOSER_IDS);
const FLUX_I2I_SET = new Set<string>(FLUX_IMAGE_TO_IMAGE_COMPOSER_IDS);

export function isFluxTextToImageComposerId(id: string): boolean {
  return FLUX_T2I_SET.has(id);
}

export function isFluxImageToImageComposerId(id: string): boolean {
  return FLUX_I2I_SET.has(id);
}

export type ImageToolsSectionId = "text-to-image" | "image-to-image" | "image-editing";

export function imageComposerVisibleInToolsSection(
  sectionId: ImageToolsSectionId,
  composerId: string
): boolean {
  if (FLUX_T2I_SET.has(composerId)) return sectionId === "text-to-image";
  if (FLUX_I2I_SET.has(composerId)) {
    return sectionId === "image-to-image" || sectionId === "image-editing";
  }
  return true;
}

export function imageComposerSupportedOnActionTab(
  composerId: string,
  actionTab: "Text to Image" | "Image to Image" | "Image Upscaler"
): boolean {
  if (actionTab === "Image Upscaler") return false;
  if (FLUX_T2I_SET.has(composerId)) return actionTab === "Text to Image";
  if (FLUX_I2I_SET.has(composerId)) return actionTab === "Image to Image";
  return true;
}

export const ATLAS_IMAGE_COMPOSER_IDS = Object.keys(ATLAS_IMAGE_MODEL_MAP);

export function isAtlasImageComposerId(id: string): boolean {
  return id in ATLAS_IMAGE_MODEL_MAP;
}

export function getAtlasImageModelLimits(id: string): {
  maxImages: number;
  defaultBatch: number;
  maxBatch: number;
  batchMode: AtlasImageModelRow["batchMode"];
} {
  const row = ATLAS_IMAGE_MODEL_MAP[id];
  if (!row) return { maxImages: 1, defaultBatch: 1, maxBatch: 1, batchMode: "atlas" as const };
  return {
    maxImages: row.maxImages,
    defaultBatch: row.defaultBatch,
    maxBatch: row.maxBatch,
    batchMode: row.batchMode
  };
}

/** Models that need one Atlas job per image (Nano Banana, Grok, …). */
export function usesParallelImageBatch(composerId: string, count: number): boolean {
  if (count <= 1) return false;
  return getAtlasImageModelLimits(composerId).batchMode === "parallel";
}

/** Batch sizes offered in Image Studio (1 / 2 / 4). */
export function getImageBatchOptions(composerId: string): number[] {
  const maxBatch = getAtlasImageModelLimits(composerId).maxBatch;
  if (maxBatch <= 1) return [1];
  return [1, 2, 4].filter((n) => n <= maxBatch);
}

export function clampImageBatchCount(composerId: string, count: number): number {
  const options = getImageBatchOptions(composerId);
  const n = Math.round(count);
  if (options.includes(n)) return n;
  return options[options.length - 1] ?? 1;
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
