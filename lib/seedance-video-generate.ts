import { AtlasApiError, atlasGenerateVideo, type AtlasGenerateVideoParams } from "@/lib/atlas-api";
import {
  buildBytePlusSeedanceBody,
  isBytePlusSeedanceEnabled,
  submitBytePlusSeedanceTask
} from "@/lib/byteplus-seedance";

export type SeedanceGenerateVideoResult =
  | { mode: "sync"; outputUrl: string; provider: "byteplus" | "atlas" }
  | { mode: "async"; predictionId: string; provider: "byteplus" | "atlas" };

/**
 * Seedance 2.0 image-to-video — BytePlus ModelArk first (when enabled), Atlas Cloud fallback.
 * Used by legacy studio routes (`/api/video`, `/api/generations/video`).
 */
export async function seedanceGenerateVideo(
  params: AtlasGenerateVideoParams
): Promise<SeedanceGenerateVideoResult> {
  if (isBytePlusSeedanceEnabled()) {
    try {
      const body = buildBytePlusSeedanceBody({
        action: "image",
        prompt: params.prompt,
        aspectRatio: params.aspect_ratio,
        resolution: params.resolution,
        durationSec: params.duration,
        generateAudio: false,
        imageUrl: params.image_url
      });
      const submitted = await submitBytePlusSeedanceTask(body);
      if (submitted.ok) {
        if (submitted.outputUrl) {
          return { mode: "sync", outputUrl: submitted.outputUrl, provider: "byteplus" };
        }
        return {
          mode: "async",
          predictionId: submitted.predictionId,
          provider: "byteplus"
        };
      }
      console.warn("[seedance-video-generate] BytePlus I2V failed, falling back to Atlas", {
        error: submitted.error
      });
    } catch (e) {
      console.warn("[seedance-video-generate] BytePlus I2V error, falling back to Atlas", e);
    }
  }

  const atlas = await atlasGenerateVideo(params);
  if (atlas.mode === "sync") {
    return { mode: "sync", outputUrl: atlas.outputUrl, provider: "atlas" };
  }
  return { mode: "async", predictionId: atlas.predictionId, provider: "atlas" };
}

export { AtlasApiError };
