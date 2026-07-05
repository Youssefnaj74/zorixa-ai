import type { TtsVoiceCategory } from "@/lib/tts/providers/types";
import { minimaxTtsProvider } from "@/lib/tts/providers/minimax";
import type { TtsProvider, TtsProviderId } from "@/lib/tts/providers/types";

const PROVIDERS: Record<TtsProviderId, TtsProvider> = {
  minimax: minimaxTtsProvider
};

/** Active TTS backend — swap here when adding another provider. */
export const ACTIVE_TTS_PROVIDER_ID: TtsProviderId = "minimax";

export function getActiveTtsProvider(): TtsProvider {
  return PROVIDERS[ACTIVE_TTS_PROVIDER_ID];
}

export function getTtsProvider(id: TtsProviderId): TtsProvider {
  return PROVIDERS[id];
}

/** Categories available on the active provider (for future tabbed voice UI). */
export function activeTtsVoiceCategories(): TtsVoiceCategory[] {
  const caps = getActiveTtsProvider().capabilities;
  const out: TtsVoiceCategory[] = [];
  if (caps.voiceLibrary) out.push("system");
  if (caps.voiceClone) out.push("cloned");
  if (caps.voiceDesign) out.push("designed");
  return out;
}
