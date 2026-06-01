/**
 * Zorixa pricing economics — Atlas wholesale + your retail markup.
 *
 * How you make money:
 * 1. **Usage markup** — user is charged more credits than raw Atlas cost (ZORIXA_USAGE_MARKUP).
 * 2. **Pack margin** — user pays $X but receives fewer credits than $X ÷ CREDIT_RETAIL_USD (PACK_CREDIT_DISCOUNT).
 *
 * @see https://www.atlascloud.ai/models/list
 */

import { formatInteger } from "@/lib/format-number";

/** Atlas wholesale: $0.001 per credit unit (1,000 units ≈ $1 API spend at cost). */
export const ATLAS_CREDIT_USD = 0.001;

/** What the user effectively pays per credit when buying a pack ($12 → 10k credits = $0.0012/cr). */
export const CREDIT_RETAIL_USD = 0.0012;

/**
 * Multiply Atlas cost when deducting credits from the user.
 * 1.5 = user pays 50% more credits than bare Atlas cost → ~33% gross margin on usage.
 */
export const ZORIXA_USAGE_MARKUP = 1.5;

/** Packs deliver this fraction of "face value" credits (rest is purchase margin). 0.85 ≈ 15% pack margin. */
export const PACK_CREDIT_DISCOUNT = 0.85;

export type AtlasPriceUnit =
  | "per image"
  | "per 5s video (720p)"
  | "per 5s video (1080p)"
  | "per 10s video (720p)";

export type AtlasModelPrice = {
  usd: number;
  unit: AtlasPriceUnit;
  note?: string;
};

/** Composer model id → Atlas wholesale cost (what Zorixa pays). */
export const ATLAS_MODEL_PRICING: Record<string, AtlasModelPrice> = {
  "gpt-image-2": { usd: 0.012, unit: "per image" },
  "nano-banana-2": { usd: 0.02, unit: "per image" },
  "nano-banana-pro": { usd: 0.04, unit: "per image", note: "Pro tier" },
  zorixa: { usd: 0.024, unit: "per image" },
  "seedream-5": { usd: 0.015, unit: "per image" },
  "grok-imagine": { usd: 0.03, unit: "per image" },
  "flux-dev": { usd: 0.025, unit: "per image" },
  "flux-schnell": { usd: 0.004, unit: "per image", note: "Fast draft" },
  "flux-dev-lora": { usd: 0.03, unit: "per image" },
  "flux-kontext-dev": { usd: 0.03, unit: "per image" },
  "flux-kontext-dev-lora": { usd: 0.035, unit: "per image" },
  "wan-image-2-7": { usd: 0.03, unit: "per image" },
  "wan-image-2-7-pro": { usd: 0.075, unit: "per image", note: "Pro / 4K-ready" },
  "wan-image-2-6": { usd: 0.025, unit: "per image" },

  "seedance-2": { usd: 0.22, unit: "per 5s video (720p)", note: "T2V / I2V / Reference" },
  "seedance-1-5": { usd: 0.18, unit: "per 5s video (720p)" },
  "kling-3-pro": { usd: 0.55, unit: "per 5s video (1080p)", note: "Pro tier" },
  "kling-2-6-motion": { usd: 0.42, unit: "per 5s video (720p)", note: "Motion control" },
  "wan-2-6": { usd: 0.2, unit: "per 5s video (720p)" },
  "wan-2-7": { usd: 0.28, unit: "per 5s video (720p)" },
  "wan-2-2-character-swap": { usd: 0.25, unit: "per 5s video (720p)" },
  "happyhorse-1": { usd: 0.2, unit: "per 5s video (720p)" },
  "hailuo-2-3": { usd: 0.15, unit: "per 5s video (720p)" },
  "google-veo-3-1": { usd: 0.85, unit: "per 5s video (1080p)", note: "Premium" },
  "vidu-q3": { usd: 0.32, unit: "per 5s video (720p)" },
  "vidu-q3-pro": { usd: 0.48, unit: "per 5s video (1080p)" },
  infinitetalk: { usd: 0.15, unit: "per 5s video (720p)", note: "Audio to video" },
  "veed-fabric-1": { usd: 0.12, unit: "per 5s video (720p)", note: "Audio to video" },
  "veed-fabric-1-fast": { usd: 0.08, unit: "per 5s video (720p)", note: "Fast A2V" }
};

/** Credits deducted from user balance (Atlas cost × markup). */
export function atlasUsdToCreditsCharged(atlasUsd: number): number {
  return Math.max(1, Math.ceil((atlasUsd / ATLAS_CREDIT_USD) * ZORIXA_USAGE_MARKUP));
}

const DEFAULT_IMAGE_USD = 0.025;
const DEFAULT_VIDEO_USD = 0.22;
const TTS_USD = 0.015;

/** Client-safe estimate for composer UI (matches server credits-charge). */
export function creditsChargedForImageModel(composerModelId: string, quantity = 1): number {
  const usd = ATLAS_MODEL_PRICING[composerModelId]?.usd ?? DEFAULT_IMAGE_USD;
  return atlasUsdToCreditsCharged(usd) * Math.max(1, quantity);
}

export function creditsChargedForVideoModel(composerModelId: string): number {
  const usd = ATLAS_MODEL_PRICING[composerModelId]?.usd ?? DEFAULT_VIDEO_USD;
  return atlasUsdToCreditsCharged(usd);
}

export function creditsChargedForTts(): number {
  return atlasUsdToCreditsCharged(TTS_USD);
}

export function formatGenerationCreditsLine(credits: number): string {
  return credits > 0 ? `-${formatInteger(credits)} CR` : "Free";
}

/** Your gross margin per generation (USD). */
export function marginUsdPerRun(atlasUsd: number): number {
  const charged = atlasUsdToCreditsCharged(atlasUsd) * CREDIT_RETAIL_USD;
  return charged - atlasUsd;
}

/** @deprecated Use atlasUsdToCreditsCharged — kept for imports. */
export function usdToCredits(atlasUsd: number): number {
  return atlasUsdToCreditsCharged(atlasUsd);
}

export function formatUsd(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(3)}`;
  if (usd < 1) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(2)}`;
}

export function formatCredits(credits: number): string {
  return `${formatInteger(credits)} cr`;
}

export type CreditPack = {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  credits: number;
  popular?: boolean;
  highlights: string[];
};

function packCreditsForPrice(usd: number): number {
  return Math.round((usd / CREDIT_RETAIL_USD) * PACK_CREDIT_DISCOUNT);
}

/** Credit packs — price in USD, credits include pack discount. */
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 12,
    yearly: 10,
    credits: packCreditsForPrice(12),
    highlights: [
      "All image models (Flux, GPT Image 2, Seedream…)",
      "Video: Seedance, Wan, Hailuo, HappyHorse",
      "Text-to-speech studio",
      "History & dashboard"
    ]
  },
  {
    id: "creator",
    name: "Creator",
    monthly: 45,
    yearly: 36,
    credits: packCreditsForPrice(45),
    popular: true,
    highlights: [
      "Everything in Starter",
      "Kling 3.0 Pro & Seedance 2.0 Reference",
      "Google Veo 3.1 & Vidu Q3",
      "Nano Banana Pro & Wan 2.7 Pro images",
      "Character swap & audio-to-video"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    monthly: 147,
    yearly: 118,
    credits: packCreditsForPrice(147),
    highlights: [
      "Everything in Creator",
      "Highest credit volume",
      "Priority support",
      "Best for teams & heavy video workflows"
    ]
  }
];

/** Estimated gross profit if user spends entire pack (revenue − max Atlas API cost). */
export function packGrossProfitUsd(pack: CreditPack, priceUsd: number): number {
  const maxAtlasSpend = (pack.credits / ZORIXA_USAGE_MARKUP) * ATLAS_CREDIT_USD;
  return priceUsd - maxAtlasSpend;
}

export type PricingCatalogSection = {
  id: string;
  title: string;
  models: {
    id: string;
    name: string;
    atlasUsd: number;
    creditsCharged: number;
    marginUsd: number;
    unit: AtlasPriceUnit;
    note?: string;
  }[];
};

const IMAGE_NAMES: Record<string, string> = {
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
  "wan-image-2-7": "Wan 2.7 Image",
  "wan-image-2-7-pro": "Wan 2.7 Pro Image",
  "wan-image-2-6": "Wan 2.6 Image"
};

const VIDEO_NAMES: Record<string, string> = {
  "seedance-2": "Seedance 2.0",
  "seedance-1-5": "Seedance 1.5 Pro",
  "kling-3-pro": "Kling 3.0 Pro",
  "kling-2-6-motion": "Kling 2.6 Motion",
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

function modelsFor(ids: string[], names: Record<string, string>): PricingCatalogSection["models"] {
  return ids
    .filter((id) => ATLAS_MODEL_PRICING[id])
    .map((id) => {
      const p = ATLAS_MODEL_PRICING[id];
      const creditsCharged = atlasUsdToCreditsCharged(p.usd);
      return {
        id,
        name: names[id] ?? id,
        atlasUsd: p.usd,
        creditsCharged,
        marginUsd: marginUsdPerRun(p.usd),
        unit: p.unit,
        note: p.note
      };
    });
}

export const PRICING_CATALOG_SECTIONS: PricingCatalogSection[] = [
  {
    id: "image",
    title: "Image generation",
    models: modelsFor(Object.keys(IMAGE_NAMES), IMAGE_NAMES)
  },
  {
    id: "video",
    title: "Video generation",
    models: modelsFor(Object.keys(VIDEO_NAMES), VIDEO_NAMES)
  }
];

export function estimateGenerations(credits: number, type: "image" | "video"): string {
  const medianAtlas = type === "image" ? 0.025 : 0.22;
  const perRun = atlasUsdToCreditsCharged(medianAtlas);
  const count = Math.floor(credits / perRun);
  return `~${formatInteger(count)}`;
}
