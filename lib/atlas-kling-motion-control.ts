// Kling v2.6 Motion Control on Atlas — kwaivgi/kling-v2.6-pro|std/motion-control

export const KLING_26_MOTION_COMPOSER_ID = "kling-2-6-motion" as const;

/** Used when the user leaves the prompt empty — motion is driven by image + reference clip. */
export const MOTION_CONTROL_DEFAULT_PROMPT =
  "Apply reference motion to the character in the image.";

export function videoComposerUsesOptionalMotionPrompt(composerModelId: string): boolean {
  return composerModelId === KLING_26_MOTION_COMPOSER_ID;
}

export function resolveMotionControlAtlasPrompt(userPrompt: string): string {
  const trimmed = userPrompt.trim();
  return trimmed || MOTION_CONTROL_DEFAULT_PROMPT;
}

/** Atlas bills per reference clip length; API has no duration param — use 5s for credit estimate. */
export const KLING_MOTION_CREDIT_ESTIMATE_SECONDS = 5 as const;

/** Max reference clip length by framing mode (Atlas / Kling motion-control). */
export const KLING_MOTION_REFERENCE_VIDEO_MAX_SECONDS = {
  image: 10,
  video: 30
} as const;

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

export type KlingMotionCharacterOrientation = "image" | "video";

export function klingMotionReferenceVideoMaxSeconds(
  orientation: KlingMotionCharacterOrientation
): number {
  return KLING_MOTION_REFERENCE_VIDEO_MAX_SECONDS[orientation];
}
