import type { TtsVoiceCategory } from "@/lib/tts/providers/types";

/** Full MiniMax library fetch — `get_voice` has no pagination; one `all` call returns every voice. */
export const TTS_VOICE_LIBRARY_CATEGORIES: TtsVoiceCategory[] = ["system", "cloned", "designed"];

export function filterVoicesByCategories(
  voices: { category?: TtsVoiceCategory }[],
  categories: TtsVoiceCategory[]
): typeof voices {
  if (categories.length === 0) return voices;
  const allowed = new Set(categories);
  return voices.filter((v) => v.category && allowed.has(v.category));
}

export function countVoicesByCategory(voices: { category?: TtsVoiceCategory }[]): Record<TtsVoiceCategory, number> {
  const counts: Record<TtsVoiceCategory, number> = { system: 0, cloned: 0, designed: 0 };
  for (const voice of voices) {
    if (voice.category) counts[voice.category] += 1;
  }
  return counts;
}
