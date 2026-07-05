/** Shared TTS types — safe to import from client components. */

import type { TtsVoiceGender, TtsVoiceStyle } from "@/lib/tts/voice-library/constants";

export type TtsVoiceLabels = {
  accent?: string;
  language?: string;
  languageLabel?: string;
  languageCode?: string;
  languageFlag?: string;
  gender?: TtsVoiceGender;
  style?: TtsVoiceStyle | string;
  [key: string]: string | undefined;
};

export type TtsVoice = {
  voice_id: string;
  name: string;
  preview_url?: string | null;
  labels?: TtsVoiceLabels;
  /** system | cloned | designed — provider-specific category */
  category?: string | null;
  /** Provider id shown in the library badge (e.g. minimax). */
  provider?: string;
  /** Quality tier badge (HD / Turbo). */
  quality?: "HD" | "Turbo";
};

export type TtsSynthesizeInput = {
  text: string;
  voiceId: string;
  modelId?: string;
  speed?: number;
};

export type TtsSynthesizeResult = {
  audio: ArrayBuffer;
  usageCharacters: number;
  traceId?: string;
  contentType: string;
};
