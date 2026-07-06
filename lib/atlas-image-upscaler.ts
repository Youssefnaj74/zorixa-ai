/** Atlas Cloud image upscaler — RealESRGAN. @see https://www.atlascloud.ai/models/atlascloud/image-upscaler */

export const ATLAS_IMAGE_UPSCALER_COMPOSER_ID = "atlas-image-upscaler" as const;

export const ATLAS_IMAGE_UPSCALER_MODEL = "atlascloud/image-upscaler" as const;

/** Atlas `outscale` accepts 1.0–4.0. */
export const ATLAS_IMAGE_UPSCALER_OUTSCALE_OPTIONS = [2, 3, 4] as const;

export type AtlasImageUpscalerOutscale = (typeof ATLAS_IMAGE_UPSCALER_OUTSCALE_OPTIONS)[number];

/** Atlas wholesale per run (flat). */
export const ATLAS_IMAGE_UPSCALER_USD_PER_RUN = 0.01;

/** Retail credits charged per upscale run (flat — all outscale tiers). */
export const ZORIXA_IMAGE_UPSCALER_CREDITS_CHARGED = 12;

export function isAtlasImageUpscalerComposerId(id: string): boolean {
  return id === ATLAS_IMAGE_UPSCALER_COMPOSER_ID;
}

export function normalizeAtlasImageUpscalerOutscale(raw: unknown): AtlasImageUpscalerOutscale {
  const n = typeof raw === "number" ? raw : Number(typeof raw === "string" ? raw.trim() : NaN);
  if (n === 3) return 3;
  if (n === 4) return 4;
  return 2;
}

export function atlasImageUpscalerUsd(): number {
  return ATLAS_IMAGE_UPSCALER_USD_PER_RUN;
}

export function buildAtlasImageUpscalerBody(input: {
  imageUrl: string;
  outscale?: AtlasImageUpscalerOutscale;
  outputFormat?: "jpeg" | "png" | "webp";
}): Record<string, unknown> {
  return {
    model: ATLAS_IMAGE_UPSCALER_MODEL,
    image: input.imageUrl,
    outscale: input.outscale ?? 4,
    output_format: input.outputFormat ?? "png"
  };
}
