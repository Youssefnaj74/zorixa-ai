import { TTS_VOICE_FAVORITES_STORAGE_KEY } from "@/lib/tts/voice-library/constants";

/** Client-only favorites persisted in localStorage. */
export function readVoiceFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TTS_VOICE_FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
  } catch {
    return [];
  }
}

export function writeVoiceFavorites(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TTS_VOICE_FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota / private mode */
  }
}

export function toggleVoiceFavorite(voiceId: string, current: string[]): string[] {
  const set = new Set(current);
  if (set.has(voiceId)) set.delete(voiceId);
  else set.add(voiceId);
  const next = [...set];
  writeVoiceFavorites(next);
  return next;
}

export function isVoiceFavorite(voiceId: string, favorites: string[]): boolean {
  return favorites.includes(voiceId);
}
