/** Classify media URLs for dashboard / history poster selection. */

export function isLikelyVideoFile(url: string): boolean {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  return [".mp4", ".webm", ".mov", ".m4v", ".mkv"].some((ext) => path.endsWith(ext));
}

export function isLikelyAudioFile(url: string): boolean {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if ([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".opus", ".webm"].some((ext) => path.endsWith(ext))) {
    return true;
  }
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\/audio\b|\/audios\b|\/speech\b|\/tts\b/.test(pathname);
  } catch {
    return false;
  }
}

export function isLikelyImageFile(url: string): boolean {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp", ".svg"].some((ext) => path.endsWith(ext))) {
    return true;
  }
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\/image\b|\/images\b|\/img\b|\/photo\b|\/photos\b/.test(pathname);
  } catch {
    return false;
  }
}

/** Still usable as an `<img>` poster in history (not video/audio/placeholder). */
export function isUsableVideoHistoryPoster(url: string | null | undefined): boolean {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) return false;
  if (raw.includes("placehold.co")) return false;
  if (isLikelyVideoFile(raw) || isLikelyAudioFile(raw)) return false;
  if (isLikelyImageFile(raw)) return true;
  // Extensionless https URLs (Atlas / Supabase) — allow unless path hints audio/video.
  try {
    const pathname = new URL(raw).pathname.toLowerCase();
    if (/\/video\b|\/videos\b|\/audio\b|\/audios\b/.test(pathname)) return false;
  } catch {
    return false;
  }
  return raw.startsWith("https://") || raw.startsWith("http://") || raw.startsWith("/");
}
