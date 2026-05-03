import type { AspectRatioId, UpscaleTier } from "@/lib/studio-constants";

import { createPrediction } from "@/lib/replicate-api";
import { replicateModels } from "@/lib/replicate";

export function aspectToSdxlSize(aspect: AspectRatioId | undefined): { width: number; height: number } {
  switch (aspect) {
    case "9:16":
      return { width: 768, height: 1344 };
    case "16:9":
      return { width: 1344, height: 768 };
    case "1:1":
    default:
      return { width: 1024, height: 1024 };
  }
}

export function aspectToVideoSize(aspect: AspectRatioId | undefined): { width: number; height: number } {
  return aspectToSdxlSize(aspect);
}

/** Real-ESRGAN on Replicate typically accepts scale 2–4; 8× uses maximum supported scale. */
export function upscaleToScale(tier: UpscaleTier | undefined): number {
  if (tier === "2x") return 2;
  if (tier === "4x") return 4;
  if (tier === "8x") return 4;
  return 2;
}

export type EnhanceRouteModel = "real_esrgan" | "codeformer" | "rembg" | "sdxl";

export function resolveSdxlSlug(): string {
  return process.env.REPLICATE_MODEL_SDXL_IMG2IMG ?? "stability-ai/sdxl";
}

export function resolveVideoModelSlug(modelId: string | undefined): string | null {
  const id = modelId ?? "default";
  if (id === "kling" && process.env.REPLICATE_MODEL_VIDEO_KLING) {
    return process.env.REPLICATE_MODEL_VIDEO_KLING;
  }
  if (id === "luma" && process.env.REPLICATE_MODEL_VIDEO_LUMA) {
    return process.env.REPLICATE_MODEL_VIDEO_LUMA;
  }
  return process.env.REPLICATE_MODEL_VIDEO ?? null;
}

export async function createEnhancePrediction(
  model: EnhanceRouteModel,
  inputUrl: string,
  opts: {
    upscale: UpscaleTier;
    prompt?: string;
    negativePrompt?: string;
    aspect?: AspectRatioId;
  }
) {
  switch (model) {
    case "real_esrgan":
      return createPrediction(replicateModels.upscale, {
        image: inputUrl,
        scale: upscaleToScale(opts.upscale)
      });
    case "codeformer":
      return createPrediction(replicateModels.enhance, { image: inputUrl });
    case "rembg":
      return createPrediction(replicateModels.removeBg, { image: inputUrl });
    case "sdxl": {
      const { width, height } = aspectToSdxlSize(opts.aspect);
      const prompt =
        opts.prompt?.trim() || "Professional photograph, highly detailed, sharp focus, natural lighting";
      const negative =
        opts.negativePrompt?.trim() ?? "blurry, low quality, distorted, ugly, watermark, text artifacts";
      return createPrediction(resolveSdxlSlug(), {
        image: inputUrl,
        prompt,
        negative_prompt: negative,
        width,
        height,
        num_inference_steps: 30,
        prompt_strength: 0.68,
        refine: "base_image_refiner",
        refine_steps: 20
      });
    }
  }
}
