import {
  atlasUsdToCreditsForGrossMargin,
  CREDIT_RETAIL_USD,
  formatGenerationCreditsLine,
  ZORIXA_FAILURE_BUFFER_MULTIPLIER,
  ZORIXA_TTS_GROSS_MARGIN
} from "@/lib/atlas-pricing-catalog";
import { formatInteger } from "@/lib/format-number";
import {
  MINIMAX_TTS_MODEL_ID,
  MINIMAX_TTS_MODEL_TURBO_ID
} from "@/lib/tts/providers/minimax/constants";
import { TTS_CLONE_ACTIVATION_TEXT } from "@/lib/tts/constants";

/**
 * MiniMax direct API pay-as-you-go (USD per character).
 * Update these rates when MiniMax pricing changes — all TTS credit math derives from here.
 */
export const MINIMAX_TTS_USD_PER_CHAR = {
  hd: 100 / 1_000_000,
  turbo: 60 / 1_000_000
} as const;

/**
 * MiniMax Rapid Voice Clone — pay-as-you-go per cloned voice.
 * @see https://platform.minimax.io/docs/guides/pricing-paygo
 */
export const MINIMAX_VOICE_CLONE_USD_PER_VOICE = 1.5;

/** HD speech — standard SaaS margin (matches ZORIXA_TTS_GROSS_MARGIN). */
export const ZORIXA_TTS_HD_GROSS_MARGIN = ZORIXA_TTS_GROSS_MARGIN;

/**
 * Turbo wholesale is cheaper — pass more savings to users with a lower target margin
 * instead of applying the same margin % as HD.
 */
export const ZORIXA_TTS_TURBO_GROSS_MARGIN = 0.58;

/** Voice clone — lower margin than HD TTS so per-voice pricing stays accessible. */
export const ZORIXA_VOICE_CLONE_GROSS_MARGIN = 0.55;

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
  const model = (modelId ?? MINIMAX_TTS_MODEL_ID).toLowerCase();
  return model.includes("turbo")
    ? MINIMAX_TTS_USD_PER_CHAR.turbo
    : MINIMAX_TTS_USD_PER_CHAR.hd;
}

export function isTurboTtsModel(modelId?: string): boolean {
  return minimaxTtsUsdPerChar(modelId) === MINIMAX_TTS_USD_PER_CHAR.turbo;
}

/** Tier-specific gross margin — HD and Turbo are priced independently. */
export function ttsGrossMarginForModel(modelId?: string): number {
  return isTurboTtsModel(modelId)
    ? ZORIXA_TTS_TURBO_GROSS_MARGIN
    : ZORIXA_TTS_HD_GROSS_MARGIN;
}

/** MiniMax provider cost for a TTS request (wholesale USD). */
export function minimaxTtsProviderCostUsd(opts: TtsPricingOptions): number {
  const chars = Math.max(0, Math.round(opts.characterCount));
  return roundUsd(chars * minimaxTtsUsdPerChar(opts.modelId));
}

/** MiniMax wholesale USD for one voice clone (clone fee + activation preview TTS). */
export function minimaxVoiceCloneProviderCostUsd(modelId?: string): number {
  return roundUsd(
    MINIMAX_VOICE_CLONE_USD_PER_VOICE +
      minimaxTtsProviderCostUsd({
        characterCount: TTS_CLONE_ACTIVATION_TEXT.length,
        modelId
      })
  );
}

/** Client-safe estimate — matches server `creditsForTts` (image/video gross-margin pattern). */
export function creditsChargedForTts(opts: TtsPricingOptions): number {
  const providerUsd = minimaxTtsProviderCostUsd(opts);
  return atlasUsdToCreditsForGrossMargin(
    providerUsd * ZORIXA_FAILURE_BUFFER_MULTIPLIER,
    ttsGrossMarginForModel(opts.modelId)
  );
}

/** Reference rate for UI comparisons (1,000 billable characters). */
export function creditsChargedForTtsPer1kChars(modelId?: string): number {
  return creditsChargedForTts({ characterCount: 1000, modelId });
}

/** Credits line for the speech panel — shows per-tier rates when script is empty. */
export function formatTtsCreditsEstimate(characterCount: number, modelId?: string): string {
  const chars = Math.max(0, Math.round(characterCount));
  const per1kHd = creditsChargedForTtsPer1kChars(MINIMAX_TTS_MODEL_ID);
  const per1kTurbo = creditsChargedForTtsPer1kChars(MINIMAX_TTS_MODEL_TURBO_ID);

  if (chars === 0) {
    return `HD ${formatInteger(per1kHd)} · Turbo ${formatInteger(per1kTurbo)} cr / 1k chars`;
  }

  return formatGenerationCreditsLine(
    creditsChargedForTts({ characterCount: chars, modelId })
  );
}

/** Compact credit hint shown on each HD / Turbo picker segment. */
export function formatTtsModelCreditHint(characterCount: number, modelId: string): string {
  const chars = Math.max(0, Math.round(characterCount));
  if (chars === 0) {
    return `${formatInteger(creditsChargedForTtsPer1kChars(modelId))}/1k`;
  }
  return `${formatInteger(creditsChargedForTts({ characterCount: chars, modelId }))} cr`;
}

/** One-time voice clone cost (MiniMax clone fee + activation preview TTS). */
export function creditsChargedForVoiceClone(modelId?: string): number {
  const providerUsd = minimaxVoiceCloneProviderCostUsd(modelId);
  return atlasUsdToCreditsForGrossMargin(
    providerUsd * ZORIXA_FAILURE_BUFFER_MULTIPLIER,
    ZORIXA_VOICE_CLONE_GROSS_MARGIN
  );
}

export function formatVoiceCloneCreditsLine(modelId?: string): string {
  return formatGenerationCreditsLine(creditsChargedForVoiceClone(modelId));
}

/** Unit economics for voice clone (includes $1.50/voice MiniMax clone fee). */
export function calculateVoiceCloneEconomicsSnapshot(input: {
  creditsCharged: number;
  modelId?: string;
}): TtsEconomicsSnapshot {
  const creditsCharged = Math.max(0, Math.round(input.creditsCharged));
  const revenueUsd = roundUsd(creditsCharged * CREDIT_RETAIL_USD);
  const providerCostUsd = minimaxVoiceCloneProviderCostUsd(input.modelId);
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
