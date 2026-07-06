import type { TtsVoice } from "@/lib/tts/types";

/** Searchable text built from existing MiniMax voice metadata — no invented fields. */
export function voiceDiscoveryHaystack(voice: TtsVoice): string {
  return [
    voice.name,
    voice.voice_id.replace(/_/g, " "),
    voice.labels?.style,
    voice.labels?.gender,
    voice.labels?.languageLabel,
    voice.labels?.accent
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function haystackIncludes(hay: string, ...terms: string[]): boolean {
  return terms.some((term) => hay.includes(term));
}

export function haystackIncludesAll(hay: string, ...terms: string[]): boolean {
  return terms.every((term) => hay.includes(term));
}
