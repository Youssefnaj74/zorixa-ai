import { synthesizeMinimaxSpeech } from "@/lib/tts/providers/minimax/synthesize";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";
import {
  TTS_DEFAULT_PREVIEW_TEXT,
  TTS_PREVIEW_TEXT_BY_LANGUAGE
} from "@/lib/tts/voice-library/constants";
import { languageMetaFromVoiceId } from "@/lib/tts/voice-library/metadata";

const PREVIEW_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type PreviewEntry = {
  audio: ArrayBuffer;
  contentType: string;
  fetchedAt: number;
};

const previewCache = new Map<string, PreviewEntry>();

function previewCacheKey(voiceId: string, modelId: string): string {
  return `${modelId}:${voiceId}`;
}

export function previewTextForVoice(voiceId: string): string {
  const language = languageMetaFromVoiceId(voiceId);
  return TTS_PREVIEW_TEXT_BY_LANGUAGE[language.id] ?? TTS_DEFAULT_PREVIEW_TEXT;
}

export async function getCachedVoicePreview(args: {
  voiceId: string;
  apiKey: string;
  modelId?: string;
}): Promise<{ audio: ArrayBuffer; contentType: string; cached: boolean }> {
  const modelId = args.modelId?.trim() || MINIMAX_TTS_MODEL_ID;
  const key = previewCacheKey(args.voiceId, modelId);
  const now = Date.now();
  const hit = previewCache.get(key);
  if (hit && now - hit.fetchedAt < PREVIEW_CACHE_TTL_MS) {
    return { audio: hit.audio, contentType: hit.contentType, cached: true };
  }

  const text = previewTextForVoice(args.voiceId);
  const result = await synthesizeMinimaxSpeech(
    { text, voiceId: args.voiceId, modelId },
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
