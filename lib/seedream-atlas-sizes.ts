/**
 * Seedream v5.0 Lite sizes from Atlas Cloud playground (exact width×height).
 * @see https://www.atlascloud.ai/models/bytedance/seedream-v5.0-lite
 */

export type SeedreamAtlasTier = "2K" | "3K";

export type SeedreamAtlasSizeOption = {
  aspect: string;
  width: number;
  height: number;
};

export type SeedreamAtlasSizeGroup = {
  tier: SeedreamAtlasTier;
  options: readonly SeedreamAtlasSizeOption[];
};

/** Atlas default / standard tier (~2K-class presets). */
const SEEDREAM_2K: readonly SeedreamAtlasSizeOption[] = [
  { aspect: "1:1", width: 2048, height: 2048 },
  { aspect: "4:3", width: 2304, height: 1728 },
  { aspect: "3:4", width: 1728, height: 2304 },
  { aspect: "16:9", width: 2848, height: 1600 },
  { aspect: "9:16", width: 1600, height: 2848 },
  { aspect: "3:2", width: 2496, height: 1664 },
  { aspect: "2:3", width: 1664, height: 2496 },
  { aspect: "21:9", width: 3136, height: 1344 }
] as const;

/** Atlas 3K tier (playground section — ratios shown in Atlas UI). */
const SEEDREAM_3K: readonly SeedreamAtlasSizeOption[] = [
  { aspect: "1:1", width: 3072, height: 3072 },
  { aspect: "4:3", width: 3456, height: 2592 },
  { aspect: "3:4", width: 2592, height: 3456 },
  { aspect: "16:9", width: 4096, height: 2304 },
  { aspect: "9:16", width: 2304, height: 4096 },
  { aspect: "2:3", width: 2496, height: 3744 }
] as const;

export const SEEDREAM_ATLAS_SIZE_GROUPS: readonly SeedreamAtlasSizeGroup[] = [
  { tier: "2K", options: SEEDREAM_2K },
  { tier: "3K", options: SEEDREAM_3K }
];

function normalizeAspectLabel(raw: string): string {
  return raw.trim().replace(/\uFF1A/g, ":").replace(/\s+/g, "");
}

export function isSeedreamAtlasTier(raw: string): raw is SeedreamAtlasTier {
  return raw.trim() === "2K" || raw.trim() === "3K";
}

export function isSeedreamSizeSelection(resolution: string, aspect: string): boolean {
  return seedreamAtlasPixels(resolution, aspect) !== null;
}

export function defaultSeedreamSelection(): { resolution: SeedreamAtlasTier; aspect: string } {
  return { resolution: "2K", aspect: "1:1" };
}

export function seedreamAtlasPixels(
  tier: string,
  aspect: string
): { width: number; height: number } | null {
  const t = tier.trim() as SeedreamAtlasTier;
  const a = normalizeAspectLabel(aspect);
  if (!isSeedreamAtlasTier(t)) return null;
  const group = SEEDREAM_ATLAS_SIZE_GROUPS.find((g) => g.tier === t);
  const row = group?.options.find((o) => o.aspect === a);
  if (!row) return null;
  return { width: row.width, height: row.height };
}

export function seedreamAtlasSizeString(tier: string, aspect: string): string | null {
  const dims = seedreamAtlasPixels(tier, aspect);
  if (!dims) return null;
  return `${dims.width}*${dims.height}`;
}

export function formatSeedreamPixelLabel(width: number, height: number): string {
  return `${width}×${height}`;
}
