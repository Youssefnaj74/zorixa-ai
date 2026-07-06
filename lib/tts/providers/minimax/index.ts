import type { TtsVoice } from "@/lib/tts/types";
import type { TtsListVoicesOptions, TtsProvider, TtsProviderCapabilities } from "@/lib/tts/providers/types";
import { fetchMinimaxVoices } from "@/lib/tts/providers/minimax/voices";
import { synthesizeMinimaxSpeech } from "@/lib/tts/providers/minimax/synthesize";

export const MINIMAX_TTS_CAPABILITIES: TtsProviderCapabilities = {
  textToSpeech: true,
  streaming: true,
  voiceClone: true,
  voiceDesign: false,
  voiceLibrary: true
};

/** MiniMax provider — TTS live; clone/design wired in dedicated modules later. */
export const minimaxTtsProvider: TtsProvider = {
  id: "minimax",
  displayName: "MiniMax",
  capabilities: MINIMAX_TTS_CAPABILITIES,
  listVoices(options?: TtsListVoicesOptions): Promise<TtsVoice[]> {
    return fetchMinimaxVoices(options?.apiKey, options?.categories ?? ["system"]);
  },
  synthesize(input, options) {
    return synthesizeMinimaxSpeech(input, options?.apiKey);
  }
};

export { cloneMinimaxVoice, generateZorixaCloneVoiceId } from "@/lib/tts/providers/minimax/voice-clone";
export { minimaxUploadFile } from "@/lib/tts/providers/minimax/upload-file";
export { fetchMinimaxVoices } from "@/lib/tts/providers/minimax/voices";
export { synthesizeMinimaxSpeech } from "@/lib/tts/providers/minimax/synthesize";
