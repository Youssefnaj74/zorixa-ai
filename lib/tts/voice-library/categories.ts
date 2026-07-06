import type { TtsVoiceCategory } from "@/lib/tts/providers/types";

/** Full MiniMax library fetch — `get_voice` has no pagination; one `all` call returns every voice. */
export const TTS_VOICE_LIBRARY_CATEGORIES: TtsVoiceCategory[] = ["system", "cloned", "designed"];

function isTtsVoiceCategory(value: string | null | undefined): value is TtsVoiceCategory {
  return value === "system" || value === "cloned" || value === "designed";
}

export function filterVoicesByCategories<T extends { category?: string | null }>(
  voices: T[],
  categories: TtsVoiceCategory[]
): T[] {
  if (categories.length === 0) return voices;
  const allowed = new Set(categories);
  return voices.filter((v) => isTtsVoiceCategory(v.category) && allowed.has(v.category));
}

export function countVoicesByCategory(
  voices: { category?: string | null }[]
): Record<TtsVoiceCategory, number> {
  const counts: Record<TtsVoiceCategory, number> = { system: 0, cloned: 0, designed: 0 };
  for (const voice of voices) {
    if (isTtsVoiceCategory(voice.category)) counts[voice.category] += 1;
  }
  return counts;
}
