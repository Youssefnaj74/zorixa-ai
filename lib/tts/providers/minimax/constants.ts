/** Default synchronous TTS model — balance of quality and cost. */
export const MINIMAX_TTS_MODEL_ID = "speech-02-hd";

export const MINIMAX_TTS_MODEL_TURBO_ID = "speech-02-turbo";

export const MINIMAX_TTS_MODEL_LABELS: Record<string, string> = {
  "speech-2.8-hd": "MiniMax Speech 2.8 HD",
  "speech-2.8-turbo": "MiniMax Speech 2.8 Turbo",
  "speech-2.6-hd": "MiniMax Speech 2.6 HD",
  "speech-2.6-turbo": "MiniMax Speech 2.6 Turbo",
  "speech-02-hd": "MiniMax Speech 02 HD",
  "speech-02-turbo": "MiniMax Speech 02 Turbo",
  "speech-01-hd": "MiniMax Speech 01 HD",
  "speech-01-turbo": "MiniMax Speech 01 Turbo"
};

export const TTS_SPEECH_MODEL_OPTIONS = [
  { id: MINIMAX_TTS_MODEL_ID, label: "HD", description: "Best quality" },
  { id: MINIMAX_TTS_MODEL_TURBO_ID, label: "Turbo", description: "Faster, lower cost" }
] as const;

export type TtsSpeechModelId = (typeof TTS_SPEECH_MODEL_OPTIONS)[number]["id"];

export function minimaxTtsModelLabel(modelId: string): string {
  return MINIMAX_TTS_MODEL_LABELS[modelId] ?? `MiniMax ${modelId}`;
}

export function isTtsSpeechModelId(value: string): value is TtsSpeechModelId {
  return TTS_SPEECH_MODEL_OPTIONS.some((option) => option.id === value);
}
