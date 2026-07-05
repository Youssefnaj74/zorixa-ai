import type { TtsSynthesizeInput, TtsSynthesizeResult, TtsVoice } from "@/lib/tts/types";

export type TtsProviderId = "minimax";

/** Voice categories exposed by providers (maps to future UI tabs). */
export type TtsVoiceCategory = "system" | "cloned" | "designed";

export type TtsProviderCapabilities = {
  textToSpeech: boolean;
  streaming: boolean;
  voiceClone: boolean;
  voiceDesign: boolean;
  voiceLibrary: boolean;
};

export type TtsListVoicesOptions = {
  apiKey?: string;
  /** When omitted, providers return voices suitable for the public selector. */
  categories?: TtsVoiceCategory[];
};

export interface TtsProvider {
  readonly id: TtsProviderId;
  readonly displayName: string;
  readonly capabilities: TtsProviderCapabilities;
  listVoices(options?: TtsListVoicesOptions): Promise<TtsVoice[]>;
  synthesize(input: TtsSynthesizeInput, options?: { apiKey?: string }): Promise<TtsSynthesizeResult>;
}
