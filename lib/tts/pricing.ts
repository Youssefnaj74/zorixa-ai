import {
  atlasUsdToCreditsForGrossMargin,
  CREDIT_RETAIL_USD,
  ZORIXA_FAILURE_BUFFER_MULTIPLIER,
  ZORIXA_TTS_GROSS_MARGIN
} from "@/lib/atlas-pricing-catalog";

/**
 * MiniMax direct API pay-as-you-go (USD per character).
 * Update these rates when MiniMax pricing changes — all TTS credit math derives from here.
 */
export const MINIMAX_TTS_USD_PER_CHAR = {
  hd: 100 / 1_000_000,
  turbo: 60 / 1_000_000
} as const;

export type TtsPricingOptions = {
  /** Billable characters in the submitted text (after trim on the server). */
  characterCount: number;
  modelId?: string;
};

function roundUsd(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Resolve MiniMax wholesale USD per character for the requested model tier. */
export function minimaxTtsUsdPerChar(modelId?: string): number {
  const model = (modelId ?? "speech-02-hd").toLowerCase();
  return model.includes("turbo")
    ? MINIMAX_TTS_USD_PER_CHAR.turbo
    : MINIMAX_TTS_USD_PER_CHAR.hd;
}

/** MiniMax provider cost for a TTS request (wholesale USD). */
export function minimaxTtsProviderCostUsd(opts: TtsPricingOptions): number {
  const chars = Math.max(0, Math.round(opts.characterCount));
  return roundUsd(chars * minimaxTtsUsdPerChar(opts.modelId));
}

/** Client-safe estimate — matches server `creditsForTts` (image/video gross-margin pattern). */
export function creditsChargedForTts(opts: TtsPricingOptions): number {
  const providerUsd = minimaxTtsProviderCostUsd(opts);
  return atlasUsdToCreditsForGrossMargin(
    providerUsd * ZORIXA_FAILURE_BUFFER_MULTIPLIER,
    ZORIXA_TTS_GROSS_MARGIN
  );
}

export type TtsEconomicsSnapshot = {
  creditsCharged: number;
  revenueUsd: number;
  providerCostUsd: number;
  grossProfitUsd: number;
  profitMarginPct: number;
};

/** Unit economics for generation_economics logging (mirrors calculateGenerationEconomics). */
export function calculateTtsEconomicsSnapshot(input: {
  creditsCharged: number;
  usageCharacters: number;
  modelId?: string;
}): TtsEconomicsSnapshot {
  const creditsCharged = Math.max(0, Math.round(input.creditsCharged));
  const revenueUsd = roundUsd(creditsCharged * CREDIT_RETAIL_USD);
  const providerCostUsd = minimaxTtsProviderCostUsd({
    characterCount: input.usageCharacters,
    modelId: input.modelId
  });
  const grossProfitUsd = roundUsd(revenueUsd - providerCostUsd);
  const profitMarginPct =
    revenueUsd > 0 ? roundPct((grossProfitUsd / revenueUsd) * 100) : 0;

  return {
    creditsCharged,
    revenueUsd,
    providerCostUsd,
    grossProfitUsd,
    profitMarginPct
  };
}
