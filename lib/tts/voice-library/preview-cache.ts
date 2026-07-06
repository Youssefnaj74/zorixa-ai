import { synthesizeMinimaxSpeech } from "@/lib/tts/providers/minimax/synthesize";
import { clampTtsSpeed, TTS_SPEED_DEFAULT } from "@/lib/tts/constants";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";
import { sampleTextForVoice } from "@/lib/tts/voice-library/sample-text";

const PREVIEW_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type PreviewEntry = {
  audio: ArrayBuffer;
  contentType: string;
  fetchedAt: number;
};

const previewCache = new Map<string, PreviewEntry>();

function previewCacheKey(voiceId: string, modelId: string, speed: number): string {
  return `${modelId}:${voiceId}:${speed}`;
}

export async function getCachedVoicePreview(args: {
  voiceId: string;
  apiKey: string;
  modelId?: string;
  speed?: number;
}): Promise<{ audio: ArrayBuffer; contentType: string; cached: boolean }> {
  const modelId = args.modelId?.trim() || MINIMAX_TTS_MODEL_ID;
  const speed = clampTtsSpeed(args.speed ?? TTS_SPEED_DEFAULT);
  const key = previewCacheKey(args.voiceId, modelId, speed);
  const now = Date.now();
  const hit = previewCache.get(key);
  if (hit && now - hit.fetchedAt < PREVIEW_CACHE_TTL_MS) {
    return { audio: hit.audio, contentType: hit.contentType, cached: true };
  }

  const text = sampleTextForVoice(args.voiceId);
  const result = await synthesizeMinimaxSpeech(
    { text, voiceId: args.voiceId, modelId, speed },
    args.apiKey
  );

  previewCache.set(key, {
    audio: result.audio,
    contentType: result.contentType,
    fetchedAt: now
  });

  return { audio: result.audio, contentType: result.contentType, cached: false };
}

export function clearVoicePreviewCache(): void {
  previewCache.clear();
}
