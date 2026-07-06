/**
 * TTS module entry — provider registry, shared types, and future voice features.
 *
 * Live: Text-to-Speech via MiniMax (`getActiveTtsProvider()`).
 * Planned: Voice Clone, Voice Design, Voice Library tabs (see providers/minimax/*).
 */
export type { TtsVoice, TtsSynthesizeInput, TtsSynthesizeResult } from "@/lib/tts/types";
export { TTS_DEFAULT_VOICES, TTS_MAX_CHARS, TTS_SPEED_DEFAULT, TTS_SPEED_MAX, TTS_SPEED_MIN, clampTtsSpeed, formatTtsSpeedLabel } from "@/lib/tts/constants";
export { calculateTtsEconomicsSnapshot, creditsChargedForTts, creditsChargedForTtsPer1kChars, formatTtsCreditsEstimate, formatTtsModelCreditHint, minimaxTtsProviderCostUsd, ttsGrossMarginForModel } from "@/lib/tts/pricing";
export type { TtsEconomicsSnapshot, TtsPricingOptions } from "@/lib/tts/pricing";
export { enrichVoiceMetadata, sortVoicesForLibrary } from "@/lib/tts/voice-library/metadata";
export { buildVoiceLibraryFacets, filterVoices, groupVoicesByLanguage } from "@/lib/tts/voice-library/filters";
export type { VoiceLibraryFacet, VoiceLibraryFilterState, VoiceLibraryGroup } from "@/lib/tts/voice-library/filters";
export {
  ACTIVE_TTS_PROVIDER_ID,
  activeTtsVoiceCategories,
  getActiveTtsProvider,
  getTtsProvider
} from "@/lib/tts/providers/registry";
export type { TtsProvider, TtsProviderId, TtsVoiceCategory } from "@/lib/tts/providers/types";
