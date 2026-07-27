/**
 * High-cost models locked to paying customers (`is_premium`).
 * Safe for client + server imports (no secrets / admin client).
 */
export const PREMIUM_VIDEO_COMPOSER_IDS = [
  "kling-3-pro",
  "kling-2-6-motion",
  "google-veo-3-1",
  "hailuo-2-3",
  "vidu-q3-pro",
  "vidu-q3",
  "seedance-2",
  "gemini-omni-flash-t2v",
  "gemini-omni-flash-i2v",
  "gemini-omni-flash-r2v"
] as const;

export const PREMIUM_IMAGE_COMPOSER_IDS = [
  "seedream-5-pro",
  "wan-image-2-7-pro",
  "nano-banana-pro"
] as const;

const premiumVideoSet = new Set<string>(PREMIUM_VIDEO_COMPOSER_IDS);
const premiumImageSet = new Set<string>(PREMIUM_IMAGE_COMPOSER_IDS);

export function isPremiumVideoModel(composerModelId: string): boolean {
  return premiumVideoSet.has(composerModelId.trim());
}

export function isPremiumImageModel(composerModelId: string): boolean {
  return premiumImageSet.has(composerModelId.trim());
}
