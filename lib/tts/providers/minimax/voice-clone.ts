/**
 * Voice Clone — Phase 2
 * @see https://platform.minimax.io/docs/api-reference/voice-cloning-intro
 *
 * Wire to `/api/tts/voice-clone` when the studio UI is ready.
 */
export type MinimaxVoiceCloneInput = {
  /** Public HTTPS URL or uploaded file reference for the source clip. */
  audioUrl: string;
  /** Optional display label stored with the cloned voice_id. */
  name?: string;
  /** Target TTS model used when activating the clone. */
  modelId?: string;
};

export type MinimaxVoiceCloneResult = {
  voiceId: string;
  /** Clones must be activated via TTS synthesis within 7 days. */
  activationRequired: true;
};

export async function cloneMinimaxVoice(_input: MinimaxVoiceCloneInput): Promise<MinimaxVoiceCloneResult> {
  throw new Error("Voice Clone is not enabled yet. See lib/tts/providers/minimax/voice-clone.ts");
}
