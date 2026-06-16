// Kling v2.6 Motion Control on Atlas — kwaivgi/kling-v2.6-pro|std/motion-control

import { WAN_22_CHARACTER_SWAP_COMPOSER_ID } from "@/lib/atlas-wan-character-swap";

export const KLING_26_MOTION_COMPOSER_ID = "kling-2-6-motion" as const;

/** Used when the user leaves the prompt empty — motion is driven by image + reference clip. */
export const MOTION_CONTROL_DEFAULT_PROMPT =
  "Apply reference motion to the character in the image.";

export function videoComposerUsesOptionalMotionPrompt(composerModelId: string): boolean {
  return (
    composerModelId === KLING_26_MOTION_COMPOSER_ID ||
    composerModelId === WAN_22_CHARACTER_SWAP_COMPOSER_ID
  );
}

export function resolveMotionControlAtlasPrompt(userPrompt: string): string {
  const trimmed = userPrompt.trim();
  return trimmed || MOTION_CONTROL_DEFAULT_PROMPT;
}

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
