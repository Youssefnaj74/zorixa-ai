import { ENHANCE_MODELS } from "@/lib/studio-constants";

/** Server-safe labels (do not import from `use client` modules). */
const IMAGE_COMPOSER_LABELS: Record<string, string> = {
  "gpt-image-2": "GPT Image 2",
  "nano-banana-2": "Nano Banana 2",
  "nano-banana-pro": "Nano Banana Pro",
  zorixa: "Zorixa",
  "seedream-5": "Seedream 5 Lite",
  "grok-imagine": "Grok Imagine"
};

const VIDEO_COMPOSER_LABELS: Record<string, string> = {
  "kling-3-pro": "Kling 3.0 Pro",
  "seedance-2": "Seedance 2.0",
  "seedance-1-5": "Seedance 1.5",
  "wan-2-6": "Wan 2.6",
  "hailuo-2-3": "Hailuo 2.3",
  "google-veo-3-1": "Google Veo 3.1"
};

const ENHANCE_LABEL_BY_ID = new Map(ENHANCE_MODELS.map((m) => [m.id, m.name]));

function humanizeComposerId(id: string): string {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** `atlas:gpt-image-2` / `replicate:codeformer` → composer id. */
export function parseComposerIdFromProvider(provider: string | null | undefined): string | null {
  if (!provider?.trim()) return null;
  const idx = provider.indexOf(":");
  if (idx === -1) return null;
  const prefix = provider.slice(0, idx);
  const id = provider.slice(idx + 1).trim();
  if (!id) return null;
  if (prefix === "atlas" || prefix === "replicate") return id;
  return null;
}

export function atlasProviderForModel(composerModelId: string | null | undefined): string {
  const id = composerModelId?.trim();
  return id ? `atlas:${id}` : "atlas";
}

export function replicateProviderForModel(composerModelId: string | null | undefined): string {
  const id = composerModelId?.trim();
  return id ? `replicate:${id}` : "replicate";
}

/** Display name for a saved generation (dashboard history cards, lightbox title). */
export function composerModelDisplayLabel(
  composerModelId: string | null | undefined,
  featureType: "image" | "video",
  provider?: string | null
): string {
  const id =
    composerModelId?.trim() || parseComposerIdFromProvider(provider) || null;
  if (!id) {
    return featureType === "video" ? "UGC video" : "AI image";
  }
  return (
    IMAGE_COMPOSER_LABELS[id] ??
    VIDEO_COMPOSER_LABELS[id] ??
    ENHANCE_LABEL_BY_ID.get(id) ??
    humanizeComposerId(id)
  );
}
