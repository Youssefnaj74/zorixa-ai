/**
 * Alibaba Wan 2.2 Animate Mix — character swap (image + reference video).
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.2/animate-mix
 */

import type { AtlasVideoSpeedTier } from "@/lib/atlas-video-model-ids";

export const WAN_22_CHARACTER_SWAP_COMPOSER_ID = "wan-2-2-character-swap" as const;

const ATLAS_SLUG = "alibaba/wan-2.2/animate-mix";

export function videoComposerSupportsWanCharacterSwap(composerModelId: string): boolean {
  return composerModelId === WAN_22_CHARACTER_SWAP_COMPOSER_ID;
}

export function isWanCharacterSwapAtlasModel(model: string): boolean {
  return /alibaba\/wan-2\.2\/animate-mix/i.test(model);
}

export function resolveWanCharacterSwapAtlasSlug(): string {
  return ATLAS_SLUG;
}

/** Atlas `mode`: wan-std (Standard) / wan-pro (Professional). */
export function wanCharacterSwapModeFromSpeedTier(tier: AtlasVideoSpeedTier): "wan-std" | "wan-pro" {
  return tier === "fast" ? "wan-pro" : "wan-std";
}

export function buildWanCharacterSwapAtlasBody(input: {
  model: string;
  prompt: string;
  image_url: string;
  video_url: string;
  speedTier: AtlasVideoSpeedTier;
}): Record<string, unknown> {
  return {
    model: input.model,
    prompt: input.prompt,
    image_url: input.image_url,
    image: input.image_url,
    video_url: input.video_url,
    video: input.video_url,
    mode: wanCharacterSwapModeFromSpeedTier(input.speedTier)
  };
}
