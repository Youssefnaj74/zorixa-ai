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
import {
  GEMINI_OMNI_FLASH_I2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_R2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_T2V_COMPOSER_ID
} from "@/lib/atlas-gemini-omni-video";
import { ZORIXA_IMAGE_UPSCALER_CREDITS_CHARGED } from "@/lib/atlas-image-upscaler";
import {
  HAILUO_23_COMPOSER_ID,
  hailuo23AtlasUsdForOptions
} from "@/lib/atlas-hailuo-video";
import {
  ATLAS_VIDEO_UPSCALER_COMPOSER_ID,
  atlasVideoUpscalerUsd,
  normalizeAtlasVideoUpscalerTarget
} from "@/lib/atlas-video-upscaler";
import {
  GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID
} from "@/lib/atlas-grok-video";

/** Atlas wholesale: $0.001 per credit unit (1,000 units ≈ $1 API spend at cost). */
export const ATLAS_CREDIT_USD = 0.001;

/** What the user effectively pays per credit. Keep credits human-scale ($9.99 → ~1,000 CR). */
export const CREDIT_RETAIL_USD = 0.01;

/**
 * Multiply Atlas cost when deducting credits from the user.
 * 1.5 = user pays 50% more credits than bare Atlas cost → ~33% gross margin on usage.
 */
export const ZORIXA_USAGE_MARKUP = 1.5;

/** Legacy helper constant kept for profit calculators; packs below use explicit rounded credit amounts. */
export const PACK_CREDIT_DISCOUNT = 0.85;

/** Target gross margin for video generations: revenue = Atlas cost / (1 - margin). */
export const ZORIXA_VIDEO_GROSS_MARGIN = 0.6;

/** Target gross margin on image generations (1K / 2K / 3K / 4K tiers). */
export const ZORIXA_IMAGE_DEFAULT_GROSS_MARGIN = 0.68;
export const ZORIXA_IMAGE_CHEAP_GROSS_MARGIN = 0.69;
export const ZORIXA_IMAGE_PREMIUM_GROSS_MARGIN = 0.68;
/** Image Upscaler tab — dedicated margin target. */
export const ZORIXA_IMAGE_UPSCALER_GROSS_MARGIN = 0.7;
export const ZORIXA_VIDEO_DEFAULT_GROSS_MARGIN = 0.65;
export const ZORIXA_VIDEO_PREMIUM_GROSS_MARGIN = 0.55;
export const ZORIXA_VIDEO_EXPENSIVE_GROSS_MARGIN = 0.5;
/** Target gross margin on MiniMax Text-to-Speech (character-metered). */
export const ZORIXA_TTS_GROSS_MARGIN = 0.7;
export const ZORIXA_FAILURE_BUFFER_MULTIPLIER = 1.05;

/** Optional native soundtrack is not always itemized by Atlas; keep a small buffer when enabled. */
export const VIDEO_SOUNDTRACK_MULTIPLIER = 1.15;

export type VideoResolutionTier = "480p" | "720p" | "1080p" | "4k";
export type VideoSpeedTier = "standard" | "fast";

export type VideoRouteAction =
  | "text"
  | "image"
  | "reference"
  | "edit"
  | "motion-control"
  | "start-end"
  | "lipsync";

export type VideoPricingOptions = {
  durationSeconds?: number;
  resolution?: string;
  speedTier?: VideoSpeedTier | string;
  generateAudio?: boolean;
  /** Used for models whose Atlas cost depends on the studio tab (e.g. Hailuo T2V vs I2V). */
  routeAction?: VideoRouteAction;
};

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
  "seedream-5-pro": { usd: 0.054, unit: "per image", note: "Pro tier · up to 10 refs on edit" },
  "grok-imagine": { usd: 0.03, unit: "per image" },
  "flux-dev": { usd: 0.025, unit: "per image" },
  "flux-schnell": { usd: 0.004, unit: "per image", note: "Fast draft" },
  "flux-dev-lora": { usd: 0.03, unit: "per image" },
  "flux-kontext-dev": { usd: 0.03, unit: "per image" },
  "flux-kontext-dev-lora": { usd: 0.035, unit: "per image" },
  "wan-image-2-7": { usd: 0.03, unit: "per image" },
  "wan-image-2-7-pro": { usd: 0.075, unit: "per image", note: "Pro / 4K-ready" },
  "wan-image-2-6": { usd: 0.025, unit: "per image" },
  "atlas-image-upscaler": { usd: 0.01, unit: "per image", note: "RealESRGAN upscale" },

  "seedance-2": { usd: 0.22, unit: "per 5s video (720p)", note: "T2V / I2V / Reference" },
  "seedance-1-5": { usd: 0.18, unit: "per 5s video (720p)" },
  "kling-3-pro": { usd: 0.55, unit: "per 5s video (1080p)", note: "Pro tier" },
  "kling-2-6-motion": { usd: 0.42, unit: "per 5s video (720p)", note: "Motion control" },
  "wan-2-6": { usd: 0.2, unit: "per 5s video (720p)" },
  "wan-2-7": { usd: 0.28, unit: "per 5s video (720p)" },
  "wan-2-2-character-swap": { usd: 0.25, unit: "per 5s video (720p)" },
  "happyhorse-1": { usd: 0.2, unit: "per 5s video (720p)" },
  "hailuo-2-3": {
    usd: 0.49,
    unit: "per 5s video (1080p)",
    note: "T2V Pro flat run; I2V Standard billed per second"
  },
  "google-veo-3-1": { usd: 0.85, unit: "per 5s video (1080p)", note: "Premium" },
  "vidu-q3": { usd: 0.32, unit: "per 5s video (720p)" },
  "vidu-q3-pro": { usd: 0.48, unit: "per 5s video (1080p)" },
  infinitetalk: { usd: 0.15, unit: "per 5s video (720p)", note: "Audio to video" },
  "veed-fabric-1": { usd: 0.12, unit: "per 5s video (720p)", note: "Audio to video" },
  "veed-fabric-1-fast": { usd: 0.08, unit: "per 5s video (720p)", note: "Fast A2V" },
  "omni-human-1-5": { usd: 0.12, unit: "per 5s video (720p)", note: "Audio to video" },
  "atlas-video-upscaler": { usd: 0.09, unit: "per 5s video (1080p)", note: "V2V FlashVSR upscale" }
};

/** Credits deducted from user balance (Atlas cost × markup). */
export function atlasUsdToCreditsCharged(atlasUsd: number): number {
  return Math.max(1, Math.ceil((atlasUsd / ATLAS_CREDIT_USD) * ZORIXA_USAGE_MARKUP));
}

export function atlasUsdToCreditsForGrossMargin(
  atlasUsd: number,
  margin = ZORIXA_VIDEO_DEFAULT_GROSS_MARGIN
): number {
  const costShare = Math.max(0.01, 1 - margin);
  return Math.max(1, Math.ceil((atlasUsd / costShare) / CREDIT_RETAIL_USD));
}

function imageMarginForModel(composerModelId: string, atlasUsd: number): number {
  if (composerModelId === "atlas-image-upscaler") return ZORIXA_IMAGE_UPSCALER_GROSS_MARGIN;
  if (composerModelId === "flux-schnell") return ZORIXA_IMAGE_CHEAP_GROSS_MARGIN;
  if (atlasUsd <= 0.02) return ZORIXA_IMAGE_CHEAP_GROSS_MARGIN;
  if (atlasUsd >= 0.06) return ZORIXA_IMAGE_PREMIUM_GROSS_MARGIN;
  return ZORIXA_IMAGE_DEFAULT_GROSS_MARGIN;
}

function normalizeVideoDurationSeconds(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 5;
  return Math.min(60, Math.max(1, Math.round(raw)));
}

function normalizeVideoResolutionTier(raw: unknown): VideoResolutionTier {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v === "4k" || v === "2160p") return "4k";
  if (v === "1080p") return "1080p";
  if (v === "480p" || v === "450p" || v === "540p") return "480p";
  return "720p";
}

function normalizeVideoSpeedTier(raw: unknown): VideoSpeedTier {
  return typeof raw === "string" && raw.trim().toLowerCase() === "fast" ? "fast" : "standard";
}

const DEFAULT_RESOLUTION_MULTIPLIER: Record<VideoResolutionTier, number> = {
  "480p": 0.75,
  "720p": 1,
  "1080p": 1.6,
  "4k": 2.4
};

type VideoRateCard = {
  /** Default Atlas cost per generated second at 720p / standard tier. */
  perSecondUsd?: number;
  resolutionRates?: Partial<Record<VideoResolutionTier, number>>;
  fastPerSecondUsd?: number;
  fastResolutionRates?: Partial<Record<VideoResolutionTier, number>>;
  fixedResolutionUsd?: Partial<Record<VideoResolutionTier, number>>;
  note?: string;
};

/** Atlas video wholesale rates used for Zorixa billing (USD/sec unless noted). */
export const ATLAS_VIDEO_RATE_CARDS: Record<string, VideoRateCard> = {
  [GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID]: {
    perSecondUsd: 0.06,
    note: "Native audio T2V"
  },
  [GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID]: {
    perSecondUsd: 0.096,
    note: "Native audio I2V v1.5"
  },
  [GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID]: {
    perSecondUsd: 0.06,
    note: "1-7 reference images"
  },
  [GEMINI_OMNI_FLASH_T2V_COMPOSER_ID]: {
    resolutionRates: { "720p": 0.15, "1080p": 0.22, "4k": 0.36 },
    note: "Developer T2V"
  },
  [GEMINI_OMNI_FLASH_I2V_COMPOSER_ID]: {
    resolutionRates: { "720p": 0.15, "1080p": 0.22, "4k": 0.36 },
    note: "Developer I2V"
  },
  [GEMINI_OMNI_FLASH_R2V_COMPOSER_ID]: {
    fixedResolutionUsd: { "720p": 1.6, "1080p": 1.6, "4k": 2.4 },
    note: "Developer R2V fixed generation price"
  },
  "seedance-2": {
    perSecondUsd: 0.1,
    fastPerSecondUsd: 0.081,
    note: "Standard/Fast, duration based"
  },
  "seedance-1-5": {
    resolutionRates: { "480p": 0.024, "720p": 0.052, "1080p": 0.122 },
    fastPerSecondUsd: 0.01
  },
  "kling-3-pro": {
    perSecondUsd: 0.112,
    fastPerSecondUsd: 0.084,
    note: "Pro or Std tier"
  },
  "kling-2-6-motion": {
    perSecondUsd: 0.084,
    fastPerSecondUsd: 0.06,
    note: "Motion control"
  },
  "wan-2-6": { perSecondUsd: 0.07 },
  "wan-2-7": { perSecondUsd: 0.1 },
  "wan-2-2-character-swap": {
    perSecondUsd: 0.05,
    fastPerSecondUsd: 0.07,
    note: "Std/Pro character swap"
  },
  "happyhorse-1": {
    resolutionRates: { "480p": 0.105, "720p": 0.14, "1080p": 0.28 }
  },
  "hailuo-2-3": {
    note: "T2V Pro flat $0.49/run; I2V Standard $0.28/s — see hailuo23AtlasUsdForOptions"
  },
  "google-veo-3-1": {
    resolutionRates: { "480p": 0.05, "720p": 0.2, "1080p": 0.2, "4k": 0.4 },
    note: "Veo 3.1 / Lite style tiers"
  },
  "vidu-q3": {
    perSecondUsd: 0.05,
    fastPerSecondUsd: 0.125,
    note: "Q3 or Mix reference tier"
  },
  "vidu-q3-pro": {
    resolutionRates: { "480p": 0.07, "720p": 0.15, "1080p": 0.16 },
    fastPerSecondUsd: 0.05,
    note: "Pro or Turbo/Start-End"
  },
  infinitetalk: { perSecondUsd: 0.15, note: "Audio to video" },
  "veed-fabric-1": { perSecondUsd: 0.12, note: "Audio to video" },
  "veed-fabric-1-fast": { perSecondUsd: 0.08, note: "Fast audio to video" },
  "omni-human-1-5": { perSecondUsd: 0.12, note: "Audio to video" }
};

function videoMarginForModel(composerModelId: string, atlasUsd: number): number {
  if (
    composerModelId === "google-veo-3-1" ||
    composerModelId === "hailuo-2-3" ||
    composerModelId === "happyhorse-1" ||
    composerModelId === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID
  ) {
    return ZORIXA_VIDEO_PREMIUM_GROSS_MARGIN;
  }
  if (atlasUsd >= 1) return ZORIXA_VIDEO_EXPENSIVE_GROSS_MARGIN;
  return ZORIXA_VIDEO_DEFAULT_GROSS_MARGIN;
}

export function atlasVideoUsdForOptions(
  composerModelId: string,
  opts: VideoPricingOptions = {}
): number {
  if (composerModelId === ATLAS_VIDEO_UPSCALER_COMPOSER_ID) {
    const target = normalizeAtlasVideoUpscalerTarget(opts.resolution);
    return atlasVideoUpscalerUsd(normalizeVideoDurationSeconds(opts.durationSeconds), target);
  }

  if (composerModelId === HAILUO_23_COMPOSER_ID) {
    return hailuo23AtlasUsdForOptions(opts);
  }

  const duration = normalizeVideoDurationSeconds(opts.durationSeconds);
  const resolution = normalizeVideoResolutionTier(opts.resolution);
  const speedTier = normalizeVideoSpeedTier(opts.speedTier);
  const card = ATLAS_VIDEO_RATE_CARDS[composerModelId];

  const resolutionMultiplier = DEFAULT_RESOLUTION_MULTIPLIER[resolution];
  const fixedUsd = card?.fixedResolutionUsd?.[resolution];
  if (fixedUsd !== undefined) {
    return fixedUsd * (opts.generateAudio ? VIDEO_SOUNDTRACK_MULTIPLIER : 1);
  }
  const rate =
    speedTier === "fast"
      ? (card?.fastResolutionRates?.[resolution] ??
        (card?.fastPerSecondUsd !== undefined
          ? card.fastPerSecondUsd * resolutionMultiplier
          : undefined) ??
        card?.resolutionRates?.[resolution] ??
        (card?.perSecondUsd !== undefined ? card.perSecondUsd * resolutionMultiplier : undefined))
      : (card?.resolutionRates?.[resolution] ??
        (card?.perSecondUsd !== undefined ? card.perSecondUsd * resolutionMultiplier : undefined));

  const fallback =
    (ATLAS_MODEL_PRICING[composerModelId]?.usd ?? DEFAULT_VIDEO_USD) / 5;
  const perSecond = rate ?? fallback * resolutionMultiplier;
  const soundtrackMultiplier = opts.generateAudio ? VIDEO_SOUNDTRACK_MULTIPLIER : 1;
  return perSecond * duration * soundtrackMultiplier;
}

const DEFAULT_IMAGE_USD = 0.025;
const DEFAULT_VIDEO_USD = 0.22;

export type ImageResolutionTier = "1K" | "2K" | "3K" | "4K";

export type ImagePricingOptions = {
  resolution?: string;
  /** Image-to-Image / edit routes often cost more per resolution tier on Atlas. */
  isEdit?: boolean;
};

const DEFAULT_IMAGE_RESOLUTION_MULTIPLIER: Record<ImageResolutionTier, number> = {
  "1K": 1,
  "2K": 1.5,
  "3K": 1.75,
  "4K": 2
};

type ImageRateCard = {
  /** Absolute Atlas USD per image at each resolution (text-to-image). */
  resolutionRates?: Partial<Record<ImageResolutionTier, number>>;
  /** Edit / I2I wholesale when it differs from T2I. */
  editResolutionRates?: Partial<Record<ImageResolutionTier, number>>;
  note?: string;
};

/** Atlas image wholesale by resolution where known; otherwise base × multiplier. */
export const ATLAS_IMAGE_RATE_CARDS: Record<string, ImageRateCard> = {
  "gpt-image-2": {
    resolutionRates: { "1K": 0.012, "2K": 0.024, "3K": 0.048, "4K": 0.048 },
    note: "Quality tier: 1K low · 2K medium · 3K high"
  },
  "nano-banana-2": {
    resolutionRates: { "1K": 0.02, "2K": 0.03, "4K": 0.04 },
    editResolutionRates: { "1K": 0.08, "2K": 0.12, "4K": 0.16 },
    note: "T2I & edit scale 1K → 2K → 4K"
  },
  "nano-banana-pro": {
    resolutionRates: { "1K": 0.04, "2K": 0.06, "4K": 0.08 },
    editResolutionRates: { "1K": 0.12, "2K": 0.18, "4K": 0.24 },
    note: "Pro tier; T2I & edit scale with resolution"
  },
  "seedream-5": {
    resolutionRates: { "1K": 0.015, "2K": 0.015, "3K": 0.025, "4K": 0.03 },
    note: "3K tier higher than 2K on Atlas"
  },
  /** Seedream v5.0 Pro — flat $0.054 across 1.5K / 2K tiers (edit +$0.003/extra ref). */
  "seedream-5-pro": {
    resolutionRates: { "1K": 0.054, "2K": 0.054, "3K": 0.054, "4K": 0.054 },
    editResolutionRates: { "1K": 0.054, "2K": 0.054, "3K": 0.054, "4K": 0.054 },
    note: "Pro tier · 1.5K / 2K"
  },
  "wan-image-2-7-pro": {
    resolutionRates: { "1K": 0.05, "2K": 0.075, "4K": 0.075 },
    note: "Pro / 4K-ready"
  }
};

export function normalizeImageResolutionTier(raw: unknown): ImageResolutionTier {
  const v = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (v === "4K") return "4K";
  if (v === "3K") return "3K";
  if (v === "2K") return "2K";
  return "1K";
}

/** Atlas wholesale USD for one image at the requested resolution. */
export function atlasImageUsdForOptions(
  composerModelId: string,
  opts: ImagePricingOptions = {}
): number {
  const tier = normalizeImageResolutionTier(opts.resolution);
  const card = ATLAS_IMAGE_RATE_CARDS[composerModelId];
  const editRates = opts.isEdit ? card?.editResolutionRates : undefined;
  if (editRates?.[tier] !== undefined) {
    return editRates[tier]!;
  }
  if (card?.resolutionRates?.[tier] !== undefined) {
    return card.resolutionRates[tier]!;
  }

  const base = ATLAS_MODEL_PRICING[composerModelId]?.usd ?? DEFAULT_IMAGE_USD;
  return base * DEFAULT_IMAGE_RESOLUTION_MULTIPLIER[tier];
}

/** Client-safe estimate for composer UI (matches server credits-charge). */
export function creditsChargedForImageModel(
  composerModelId: string,
  quantity = 1,
  opts: ImagePricingOptions = {}
): number {
  if (composerModelId === "atlas-image-upscaler") {
    return ZORIXA_IMAGE_UPSCALER_CREDITS_CHARGED * Math.max(1, quantity);
  }
  const usd = atlasImageUsdForOptions(composerModelId, opts);
  const margin = imageMarginForModel(composerModelId, usd);
  const perImage = atlasUsdToCreditsForGrossMargin(
    usd * ZORIXA_FAILURE_BUFFER_MULTIPLIER,
    margin
  );
  return perImage * Math.max(1, quantity);
}

export function creditsChargedForVideoModel(
  composerModelId: string,
  opts: VideoPricingOptions = {}
): number {
  const usd = atlasVideoUsdForOptions(composerModelId, opts);
  const margin = videoMarginForModel(composerModelId, usd);
  return atlasUsdToCreditsForGrossMargin(usd * ZORIXA_FAILURE_BUFFER_MULTIPLIER, margin);
}

export function formatGenerationCreditsLine(credits: number): string {
  return credits > 0 ? `${formatInteger(credits)} Credits` : "Free";
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
  tagline: string;
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
    monthly: 9.99,
    yearly: 8.99,
    credits: 1000,
    tagline: "Perfect for trying ZorixaAI",
    highlights: [
      "All image models (Flux, GPT Image 2, Seedream…)",
      "Video: Seedance, Wan, Hailuo, HappyHorse",
      "Text-to-speech studio",
      "History & dashboard"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 25.99,
    yearly: 23.39,
    credits: 3200,
    tagline: "For creators generating weekly content",
    highlights: [
      "Everything in Starter",
      "Kling 3.0 Pro & Seedance 2.0 Reference",
      "Google Veo 3.1 & Vidu Q3",
      "Nano Banana Pro & Wan 2.7 Pro images",
      "Character swap & audio-to-video"
    ]
  },
  {
    id: "creator",
    name: "Creator",
    monthly: 42.99,
    yearly: 38.69,
    credits: 5600,
    tagline: "Best value for active creators",
    popular: true,
    highlights: [
      "Everything in Pro",
      "More room for 1080p video generations",
      "Great value for active creators",
      "Best balance of price and volume"
    ]
  },
  {
    id: "ultra",
    name: "Ultra",
    monthly: 69.99,
    yearly: 62.99,
    credits: 10000,
    tagline: "Built for agencies and power users",
    highlights: [
      "Everything in Pro",
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
  "seedream-5-pro": "Seedream 5 Pro",
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
  [GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID]: "Grok Imagine Video Text-to-Video",
  [GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID]: "Grok Imagine Video Image-to-Video v1.5",
  [GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID]: "Grok Imagine Video Reference-to-Video",
  [GEMINI_OMNI_FLASH_T2V_COMPOSER_ID]: "Gemini Omni Flash Text-to-Video",
  [GEMINI_OMNI_FLASH_I2V_COMPOSER_ID]: "Gemini Omni Flash Image-to-Video",
  [GEMINI_OMNI_FLASH_R2V_COMPOSER_ID]: "Gemini Omni Flash Reference-to-Video",
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
  "veed-fabric-1-fast": "VEED Fabric 1.0 Fast",
  "omni-human-1-5": "OmniHuman 1.5",
  "atlas-video-upscaler": "Video Upscaler"
};

function modelsFor(ids: string[], names: Record<string, string>): PricingCatalogSection["models"] {
  return ids
    .filter((id) => ATLAS_MODEL_PRICING[id] || ATLAS_VIDEO_RATE_CARDS[id])
    .map((id) => {
      const isVideo = Boolean(VIDEO_NAMES[id]);
      const p = ATLAS_MODEL_PRICING[id];
      const imageOpts = { resolution: "2K" as const };
      const atlasUsd = isVideo
        ? atlasVideoUsdForOptions(id)
        : atlasImageUsdForOptions(id, imageOpts);
      const creditsCharged = isVideo
        ? creditsChargedForVideoModel(id)
        : creditsChargedForImageModel(id, 1, imageOpts);
      return {
        id,
        name: names[id] ?? id,
        atlasUsd,
        creditsCharged,
        marginUsd: creditsCharged * CREDIT_RETAIL_USD - atlasUsd,
        unit: isVideo ? ("per 5s video (720p)" as const) : (p?.unit ?? "per image"),
        note: ATLAS_VIDEO_RATE_CARDS[id]?.note ?? ATLAS_IMAGE_RATE_CARDS[id]?.note ?? p?.note
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
  if (credits <= 0) return "0";
  const perRun =
    type === "image"
      ? creditsChargedForImageModel("flux-dev")
      : creditsChargedForVideoModel("seedance-2");
  if (perRun <= 0) return "0";
  const count = Math.floor(credits / perRun);
  return `~${formatInteger(count)}`;
}

export const PRICING_CREDIT_VARIANCE_NOTE =
  "Credits usage varies by model. Premium models such as Veo 3.1, Kling 3.0 Pro and Gemini Omni Flash consume more credits.";
