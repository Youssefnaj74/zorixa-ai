/**
 * Map Enhancor sidebar labels → Zorixa image studio `modelId`.
 * Use when copying prompts from app.enhancor.ai into `data/explore-prompts.json`.
 */
export const ENHANCOR_TO_ZORIXA_IMAGE_MODEL: Record<string, string> = {
  "gpt image 2": "gpt-image-2",
  "seedream 5 lite": "seedream-5",
  "kora reality": "zorixa",
  "zorixa image": "zorixa",
  "z-image base": "flux-dev",
  "grok imagine": "grok-imagine",
  "nano banana": "nano-banana-2",
  "nano banana 2": "nano-banana-2",
  "nano banana pro": "nano-banana-pro",
  "flux dev": "flux-dev",
  "flux schnell": "flux-schnell"
};

export function zorixaModelIdFromEnhancorLabel(label: string): string | null {
  const key = label.trim().toLowerCase();
  return ENHANCOR_TO_ZORIXA_IMAGE_MODEL[key] ?? null;
}
