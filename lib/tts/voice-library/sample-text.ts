import {
  TTS_DEFAULT_PREVIEW_TEXT,
  TTS_PREVIEW_TEXT_BY_LANGUAGE
} from "@/lib/tts/voice-library/constants";
import { languageMetaFromVoiceId } from "@/lib/tts/voice-library/metadata";

/** Default script when the user picks a voice with an empty composer. */
export function sampleTextForVoice(voiceId: string): string {
  const language = languageMetaFromVoiceId(voiceId);
  return TTS_PREVIEW_TEXT_BY_LANGUAGE[language.id] ?? TTS_DEFAULT_PREVIEW_TEXT;
}

/** @deprecated Use sampleTextForVoice — kept for voice-preview cache. */
export const previewTextForVoice = sampleTextForVoice;
