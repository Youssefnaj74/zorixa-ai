/**
 * Voice Design — Phase 2
 * @see https://platform.minimax.io/docs/guides/speech-voice-design
 *
 * Wire to `/api/tts/voice-design` when the studio UI is ready.
 */
export type MinimaxVoiceDesignInput = {
  /** Natural-language description of the desired voice. */
  prompt: string;
  /** Preview line synthesized with the designed voice. */
  previewText?: string;
  modelId?: string;
};

export type MinimaxVoiceDesignResult = {
  voiceId: string;
  previewAudioUrl?: string;
};

export async function designMinimaxVoice(_input: MinimaxVoiceDesignInput): Promise<MinimaxVoiceDesignResult> {
  throw new Error("Voice Design is not enabled yet. See lib/tts/providers/minimax/voice-design.ts");
}
