import type { TtsVoice, TtsVoiceLabels } from "@/lib/tts/types";
import {
  TTS_LANGUAGE_BY_PREFIX,
  type TtsVoiceGender,
  type TtsVoiceLanguageMeta,
  type TtsVoiceStyle
} from "@/lib/tts/voice-library/constants";
import { ACTIVE_TTS_PROVIDER_ID } from "@/lib/tts/providers/registry";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";

export function languageMetaFromVoiceId(voiceId: string): TtsVoiceLanguageMeta {
  const prefix = voiceId.split("_")[0]?.trim().toLowerCase().replace(/[()]/g, "") ?? "";
  if (prefix && TTS_LANGUAGE_BY_PREFIX[prefix]) {
    return TTS_LANGUAGE_BY_PREFIX[prefix];
  }
  return { id: "multilingual", label: "Multilingual", flag: "🌐", code: "multi" };
}

function inferGender(voiceId: string, name: string): TtsVoiceGender {
  const hay = `${voiceId} ${name}`.toLowerCase();

  if (/\b(child|kid|young|toddler|teen)\b/.test(hay)) return "child";
  if (/\b(girl|woman|female|lady|aunt|grandma|grandmother|queen|princess|mother|mom|sister|daughter|wife|miss|mrs|ms)\b/.test(hay)) {
    return "female";
  }
  if (/\b(man|male|boy|guy|uncle|grandpa|grandfather|king|prince|father|dad|brother|son|husband|mr)\b/.test(hay)) {
    return "male";
  }
  return "neutral";
}

function inferStyle(voiceId: string, name: string, description?: string[]): TtsVoiceStyle {
  const hay = `${voiceId} ${name} ${(description ?? []).join(" ")}`.toLowerCase();

  if (/\b(child|kid|young|toddler|teen)\b/.test(hay)) return "Child";
  if (/\b(news|anchor|reporter|broadcaster|broadcast)\b/.test(hay)) return "News";
  if (/\b(audiobook|book|storyteller|storytelling|story)\b/.test(hay)) return "Audiobook";
  if (/\b(narrator|narration|documentary)\b/.test(hay)) return "Narrator";
  if (/\b(conversational|chat|friendly|casual|companion)\b/.test(hay)) return "Conversational";
  if (/\b(calm|soothing|serene|gentle|soft|peaceful|relax)\b/.test(hay)) return "Calm";
  if (/\b(energetic|vibrant|radiant|lively|dynamic|upbeat|excited)\b/.test(hay)) return "Energetic";
  if (/\b(emotional|expressive|passionate|dramatic|soulful)\b/.test(hay)) return "Emotional";
  if (/\b(trust|professional|authoritative|captivating)\b/.test(hay)) return "Narrator";

  return "General";
}

/** Enriches a raw provider voice with language, gender, style, and UI badges. */
export function enrichVoiceMetadata(
  voice: TtsVoice,
  options?: { description?: string[]; quality?: "HD" | "Turbo" }
): TtsVoice {
  const language = languageMetaFromVoiceId(voice.voice_id);
  const gender = inferGender(voice.voice_id, voice.name);
  const style = inferStyle(voice.voice_id, voice.name, options?.description);

  const labels: TtsVoiceLabels = {
    ...voice.labels,
    accent: voice.labels?.accent ?? language.id,
    language: language.id,
    languageLabel: language.label,
    languageCode: language.code,
    languageFlag: language.flag,
    gender,
    style
  };

  return {
    ...voice,
    labels,
    provider: voice.provider ?? ACTIVE_TTS_PROVIDER_ID,
    quality: voice.quality ?? options?.quality ?? "HD",
    preview_url:
      voice.preview_url ??
      `/api/tts/voice-preview?voice_id=${encodeURIComponent(voice.voice_id)}&model_id=${encodeURIComponent(MINIMAX_TTS_MODEL_ID)}`
  };
}

/** Sort key: English first, then language label, then name. */
export function voiceLibrarySortKey(voice: TtsVoice): string {
  const lang = voice.labels?.language ?? "zzz";
  const englishFirst = lang === "english" ? "0" : "1";
  const label = voice.labels?.languageLabel ?? lang;
  return `${englishFirst}:${label}:${voice.name.toLowerCase()}`;
}

export function sortVoicesForLibrary(voices: TtsVoice[]): TtsVoice[] {
  return [...voices].sort((a, b) => voiceLibrarySortKey(a).localeCompare(voiceLibrarySortKey(b)));
}

export function genderLabel(gender: TtsVoiceGender | undefined): string {
  switch (gender) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "child":
      return "Child";
    default:
      return "Neutral";
  }
}
