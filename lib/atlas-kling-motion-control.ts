// Kling v2.6 Motion Control on Atlas — kwaivgi/kling-v2.6-pro|std/motion-control

export const KLING_26_MOTION_COMPOSER_ID = "kling-2-6-motion" as const;

export type KlingMotionCharacterOrientation = "image" | "video";

export function isKlingMotionControlAtlasModel(model: string): boolean {
  return /kling-v2\.6-(pro|std)\/motion-control/i.test(model);
}

export function normalizeKlingMotionCharacterOrientation(
  raw: unknown
): KlingMotionCharacterOrientation {
  if (typeof raw === "string" && raw.trim().toLowerCase() === "video") {
    return "video";
  }
  return "image";
}

/** Atlas bills 5–30s depending on orientation; clamp to supported range. */
export function normalizeKlingMotionDurationSeconds(
  durationSec: number,
  orientation: KlingMotionCharacterOrientation
): number {
  const max = orientation === "video" ? 30 : 15;
  return Math.min(max, Math.max(5, Math.round(durationSec)));
}
