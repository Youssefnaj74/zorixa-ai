import type { TtsVoice } from "@/lib/tts/types";
import type { TtsVoiceGender } from "@/lib/tts/voice-library/constants";
import { genderLabel } from "@/lib/tts/voice-library/metadata";

export type VoiceLibraryFilterState = {
  search: string;
  language: string;
  gender: "all" | TtsVoiceGender;
  style: string;
  favoritesOnly: boolean;
  favoriteIds: Set<string>;
};

export type VoiceLibraryFacet = {
  id: string;
  label: string;
  count: number;
  flag?: string;
};

export type VoiceLibraryGroup = {
  id: string;
  label: string;
  flag?: string;
  voices: TtsVoice[];
};

export function voiceMatchesSearch(voice: TtsVoice, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    voice.name,
    voice.voice_id,
    voice.labels?.languageLabel,
    voice.labels?.style,
    voice.labels?.gender,
    voice.labels?.accent
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function voiceMatchesFilters(voice: TtsVoice, filters: VoiceLibraryFilterState): boolean {
  if (filters.favoritesOnly && !filters.favoriteIds.has(voice.voice_id)) return false;
  if (!voiceMatchesSearch(voice, filters.search)) return false;

  if (filters.language !== "all" && voice.labels?.language !== filters.language) return false;
  if (filters.gender !== "all" && voice.labels?.gender !== filters.gender) return false;
  if (filters.style !== "all" && voice.labels?.style !== filters.style) return false;

  return true;
}

export function filterVoices(voices: TtsVoice[], filters: VoiceLibraryFilterState): TtsVoice[] {
  return voices.filter((v) => voiceMatchesFilters(v, filters));
}

export function groupVoicesByLanguage(voices: TtsVoice[]): VoiceLibraryGroup[] {
  const map = new Map<string, VoiceLibraryGroup>();

  for (const voice of voices) {
    const id = voice.labels?.language ?? "multilingual";
    const label = voice.labels?.languageLabel ?? "Multilingual";
    const flag = voice.labels?.languageFlag ?? "🌐";
    const existing = map.get(id);
    if (existing) {
      existing.voices.push(voice);
    } else {
      map.set(id, { id, label, flag, voices: [voice] });
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.id === "english") return -1;
    if (b.id === "english") return 1;
    return a.label.localeCompare(b.label);
  });
}

export function buildLanguageFacets(voices: TtsVoice[]): VoiceLibraryFacet[] {
  const counts = new Map<string, VoiceLibraryFacet>();

  for (const voice of voices) {
    const id = voice.labels?.language ?? "multilingual";
    const label = voice.labels?.languageLabel ?? "Multilingual";
    const flag = voice.labels?.languageFlag ?? "🌐";
    const prev = counts.get(id);
    if (prev) prev.count += 1;
    else counts.set(id, { id, label, flag, count: 1 });
  }

  return [...counts.values()].sort((a, b) => {
    if (a.id === "english") return -1;
    if (b.id === "english") return 1;
    return a.label.localeCompare(b.label);
  });
}

export function buildGenderFacets(voices: TtsVoice[]): VoiceLibraryFacet[] {
  const counts = new Map<TtsVoiceGender, number>();
  for (const voice of voices) {
    const g = (voice.labels?.gender ?? "neutral") as TtsVoiceGender;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const order: TtsVoiceGender[] = ["female", "male", "neutral", "child"];
  return order
    .filter((id) => (counts.get(id) ?? 0) > 0)
    .map((id) => ({ id, label: genderLabel(id), count: counts.get(id) ?? 0 }));
}

export function buildStyleFacets(voices: TtsVoice[]): VoiceLibraryFacet[] {
  const counts = new Map<string, number>();
  for (const voice of voices) {
    const style = voice.labels?.style ?? "General";
    counts.set(style, (counts.get(style) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({ id, label: id, count }));
}

export function buildVoiceLibraryFacets(voices: TtsVoice[]) {
  return {
    languages: buildLanguageFacets(voices),
    genders: buildGenderFacets(voices),
    styles: buildStyleFacets(voices)
  };
}
