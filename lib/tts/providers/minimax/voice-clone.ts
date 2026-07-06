/**
 * Voice Clone — MiniMax Speech API
 * @see https://platform.minimax.io/docs/api-reference/voice-cloning-clone
 */
import { minimaxPostJson } from "@/lib/tts/providers/minimax/client";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";
import { TTS_CLONE_ACTIVATION_TEXT } from "@/lib/tts/constants";
import { minimaxUploadFile } from "@/lib/tts/providers/minimax/upload-file";

export type MinimaxVoiceCloneInput = {
  file: Blob;
  filename: string;
  voiceId: string;
  modelId?: string;
  /** Short preview line to activate the clone (billed as TTS). */
  activationText?: string;
};

export type MinimaxVoiceCloneResult = {
  voiceId: string;
  demoAudioUrl: string | null;
  usageCharacters: number;
  activated: boolean;
};

type VoiceCloneResponse = {
  demo_audio?: string;
  extra_info?: { usage_characters?: number };
  base_resp?: { status_code?: number; status_msg?: string };
};

/** Generate a MiniMax-compatible custom voice_id (8–256 chars, starts with a letter). */
export function generateZorixaCloneVoiceId(): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `zorixa_${suffix}`;
}

export async function cloneMinimaxVoice(
  input: MinimaxVoiceCloneInput,
  apiKey?: string
): Promise<MinimaxVoiceCloneResult> {
  const voiceId = input.voiceId.trim();
  if (!/^zorixa_[a-z0-9_]{6,250}$/i.test(voiceId)) {
    throw new Error("Invalid clone voice id");
  }

  const { fileId } = await minimaxUploadFile(input.file, input.filename, "voice_clone", apiKey);

  const model = input.modelId?.trim() || MINIMAX_TTS_MODEL_ID;
  const activationText = (input.activationText?.trim() || TTS_CLONE_ACTIVATION_TEXT).slice(0, 500);

  const { json } = await minimaxPostJson<VoiceCloneResponse>(
    "/v1/voice_clone",
    {
      file_id: fileId,
      voice_id: voiceId,
      text: activationText,
      model,
      need_noise_reduction: true,
      need_volume_normalization: true
    },
    apiKey
  );

  const usageCharacters = Math.max(json.extra_info?.usage_characters ?? 0, activationText.length);
  const demoAudioUrl = json.demo_audio?.trim() || null;

  return {
    voiceId,
    demoAudioUrl,
    usageCharacters,
    activated: Boolean(demoAudioUrl || usageCharacters > 0)
  };
}
