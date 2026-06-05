import { ENHANCE_MODELS, type EnhanceModelId } from "@/lib/studio-constants";
import { isTtsGenerationProvider } from "@/lib/tts-generation-shared";

/** Server-safe labels (do not import from `use client` modules). */
const IMAGE_COMPOSER_LABELS: Record<string, string> = {
  "gpt-image-2": "GPT Image 2",
  "nano-banana-2": "Nano Banana 2",
  "nano-banana-pro": "Nano Banana Pro",
  zorixa: "Qwen 2.0 Pro",
  "seedream-5": "Seedream 5 Lite",
  "grok-imagine": "Grok Imagine",
  "flux-dev": "Flux Dev",
  "flux-schnell": "Flux Schnell",
  "flux-dev-lora": "Flux Dev LoRA",
  "flux-kontext-dev": "Flux Kontext Dev",
  "flux-kontext-dev-lora": "Flux Kontext Dev LoRA",
  "wan-image-2-7": "Wan 2.7",
  "wan-image-2-7-pro": "Wan 2.7 Pro",
  "wan-image-2-6": "Wan 2.6"
};

const VIDEO_COMPOSER_LABELS: Record<string, string> = {
  "grok-imagine-video-t2v": "Grok Imagine",
  "grok-imagine-video-i2v-15": "Grok Imagine v1.5",
  "grok-imagine-video-r2v": "Grok Imagine",
  "gemini-omni-flash-t2v": "Gemini Omni Flash",
  "gemini-omni-flash-i2v": "Gemini Omni Flash",
  "gemini-omni-flash-r2v": "Gemini Omni Flash",
  "kling-3-pro": "Kling 3.0 Pro",
  "kling-2-6-motion": "Kling 2.6 Motion",
  "seedance-2": "Seedance 2.0",
  "seedance-1-5": "Seedance 1.5 Pro",
  "wan-2-6": "Wan 2.6",
  "wan-2-7": "Wan 2.7",
  "wan-2-2-character-swap": "Wan 2.2 Character Swap",
  "happyhorse-1": "HappyHorse 1.0",
  "hailuo-2-3": "Hailuo 2.3",
  "google-veo-3-1": "Google Veo 3.1",
  "vidu-q3": "Vidu Q3",
  "vidu-q3-pro": "Vidu Q3-Pro",
  infinitetalk: "InfiniteTalk",
  "veed-fabric-1": "VEED Fabric 1.0",
  "veed-fabric-1-fast": "VEED Fabric 1.0 Fast"
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
  if (isTtsGenerationProvider(provider)) {
    return "Speech";
  }
  const id =
    composerModelId?.trim() || parseComposerIdFromProvider(provider) || null;
  if (!id) {
    return featureType === "video" ? "UGC video" : "AI image";
  }
  return (
    IMAGE_COMPOSER_LABELS[id] ??
    VIDEO_COMPOSER_LABELS[id] ??
    ENHANCE_LABEL_BY_ID.get(id as EnhanceModelId) ??
    humanizeComposerId(id)
  );
}
