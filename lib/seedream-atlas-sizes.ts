/**
 * Seedream v5.0 Lite sizes from Atlas Cloud playground (exact width×height).
 * @see https://www.atlascloud.ai/models/bytedance/seedream-v5.0-lite
 */

export type SeedreamAtlasTier = "1K" | "1.5K" | "2K" | "3K";

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

/**
 * Seedream v5.0 Pro sizes — all 13 Atlas presets, grouped into the same
 * 1K / 2K / 3K tiers Atlas shows (by longest side). Split so every tier has
 * unique aspect ratios (selection state is keyed by `resolution` + `aspect`).
 * Total pixels stay within Atlas' [1024×1024 … 2048×2048] envelope.
 * @see https://www.atlascloud.ai/models/bytedance/seedream-v5.0-pro/text-to-image
 */
const SEEDREAM_PRO_1K: readonly SeedreamAtlasSizeOption[] = [
  { aspect: "1:1", width: 1024, height: 1024 }
] as const;

const SEEDREAM_PRO_2K: readonly SeedreamAtlasSizeOption[] = [
  { aspect: "1:1", width: 1536, height: 1536 },
  { aspect: "4:3", width: 1776, height: 1328 },
  { aspect: "3:4", width: 1328, height: 1776 },
  { aspect: "16:9", width: 2048, height: 1152 },
  { aspect: "9:16", width: 1152, height: 2048 }
] as const;

const SEEDREAM_PRO_3K: readonly SeedreamAtlasSizeOption[] = [
  { aspect: "1:1", width: 2048, height: 2048 },
  { aspect: "4:3", width: 2304, height: 1728 },
  { aspect: "3:4", width: 1728, height: 2304 },
  { aspect: "16:9", width: 2720, height: 1530 },
  { aspect: "9:16", width: 1530, height: 2720 },
  { aspect: "3:2", width: 2496, height: 1664 },
  { aspect: "2:3", width: 1664, height: 2496 }
] as const;

export const SEEDREAM_PRO_ATLAS_SIZE_GROUPS: readonly SeedreamAtlasSizeGroup[] = [
  { tier: "3K", options: SEEDREAM_PRO_3K },
  { tier: "2K", options: SEEDREAM_PRO_2K },
  { tier: "1K", options: SEEDREAM_PRO_1K }
];

export function isSeedreamProComposerId(id: string): boolean {
  return id === "seedream-5-pro";
}

function isSeedreamProAtlasModel(model: string): boolean {
  return /seedream-v5\.0-pro/i.test(model);
}

/** Size groups shown in the studio for a Seedream composer (Pro caps at 2048²). */
export function seedreamSizeGroupsForComposer(
  composerId: string
): readonly SeedreamAtlasSizeGroup[] {
  return isSeedreamProComposerId(composerId)
    ? SEEDREAM_PRO_ATLAS_SIZE_GROUPS
    : SEEDREAM_ATLAS_SIZE_GROUPS;
}

/** Default size per composer (Pro's 2048×2048 default lives in the 3K tier). */
export function defaultSeedreamSelectionForComposer(
  composerId: string
): { resolution: SeedreamAtlasTier; aspect: string } {
  return isSeedreamProComposerId(composerId)
    ? { resolution: "3K", aspect: "1:1" }
    : defaultSeedreamSelection();
}

function seedreamGroupsForModel(model: string): readonly SeedreamAtlasSizeGroup[] {
  return isSeedreamProAtlasModel(model)
    ? SEEDREAM_PRO_ATLAS_SIZE_GROUPS
    : SEEDREAM_ATLAS_SIZE_GROUPS;
}

/** Pixels for the Atlas model slug (Pro and Lite have different presets). */
export function seedreamAtlasPixelsForModel(
  model: string,
  tier: string,
  aspect: string
): { width: number; height: number } | null {
  const a = normalizeAspectLabel(aspect);
  const group = seedreamGroupsForModel(model).find((g) => g.tier === tier.trim());
  const row = group?.options.find((o) => o.aspect === a);
  return row ? { width: row.width, height: row.height } : null;
}

/** Whether a resolution/aspect pair is valid for the given Seedream composer. */
export function isSeedreamSizeSelectionForComposer(
  composerId: string,
  resolution: string,
  aspect: string
): boolean {
  const a = normalizeAspectLabel(aspect);
  const group = seedreamSizeGroupsForComposer(composerId).find(
    (g) => g.tier === resolution.trim()
  );
  return Boolean(group?.options.find((o) => o.aspect === a));
}

function normalizeAspectLabel(raw: string): string {
  return raw.trim().replace(/\uFF1A/g, ":").replace(/\s+/g, "");
}

export function isSeedreamAtlasTier(raw: string): raw is SeedreamAtlasTier {
  const v = raw.trim();
  return v === "1K" || v === "1.5K" || v === "2K" || v === "3K";
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
