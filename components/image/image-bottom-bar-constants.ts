export const IMAGE_CAMERA_STYLES = [
  "None",
  "iPhone Selfie",
  "Mirror Selfie",
  "Top Down View",
  "Full Bodyshot"
] as const;

export const IMAGE_RESOLUTIONS = ["2K", "4K", "1K"] as const;

export const IMAGE_ASPECTS = ["Auto", "1:1", "16:9", "9:16", "4:3"] as const;

/**
 * GPT Image 2 UI tiers (match Atlas quality: 1K→low, 2K→medium, 3K→high).
 * Atlas playground hides 16:9/9:16 under 2K/3K only; API still accepts those
 * dimensions at any quality, so we allow wide/tall ratios at 1K too.
 */
export const GPT_IMAGE_2_SIZE_GROUPS = [
  {
    tier: "1K",
    aspects: ["4:3", "3:4", "1:1", "2:3", "3:2", "16:9", "9:16"] as const
  },
  { tier: "2K", aspects: ["16:9", "9:16"] as const },
  { tier: "3K", aspects: ["16:9", "9:16"] as const }
] as const;

export function isGptImage2SizeSelection(resolution: string, aspect: string): boolean {
  const tier = resolution.trim();
  const a = aspect.trim();
  for (const g of GPT_IMAGE_2_SIZE_GROUPS) {
    if (g.tier !== tier) continue;
    if ((g.aspects as readonly string[]).includes(a)) return true;
  }
  return false;
}

export function defaultGptImage2Selection(): {
  resolution: string;
  aspect: string;
} {
  return { resolution: "1K", aspect: "3:2" };
}

export {
  defaultSeedreamSelection,
  formatSeedreamPixelLabel,
  isSeedreamSizeSelection,
  SEEDREAM_ATLAS_SIZE_GROUPS
} from "@/lib/seedream-atlas-sizes";
