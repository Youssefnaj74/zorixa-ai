/** Shared TTS types — safe to import from client components. */

export type TtsVoice = {
  voice_id: string;
  name: string;
  preview_url?: string | null;
  labels?: Record<string, string>;
  /** system | cloned | designed — provider-specific category */
  category?: string | null;
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
