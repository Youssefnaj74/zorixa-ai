/** Client-safe TTS generation helpers (no Supabase admin). */

export function isTtsGenerationProvider(provider: string | null | undefined): boolean {
  const normalized = provider?.trim().toLowerCase() ?? "";
  return normalized.startsWith("minimax-tts") || normalized.startsWith("elevenlabs-tts");
}

export function isLikelyAudioOutputUrl(url: string | null | undefined): boolean {
  const path = url?.split("?")[0]?.toLowerCase() ?? "";
  return [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm"].some((ext) =>
    path.endsWith(ext)
  );
}

export function isTtsGenerationRow(row: {
  provider?: string | null;
  output_url?: string | null;
}): boolean {
  return isTtsGenerationProvider(row.provider) || isLikelyAudioOutputUrl(row.output_url);
}
