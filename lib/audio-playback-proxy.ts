import { isAllowedVideoPlaybackHost } from "@/lib/video-playback-proxy";

/** Hosts allowed through `/api/audio-playback` (Supabase uploads + shared CDN allowlist). */
export function isAllowedAudioPlaybackHost(hostname: string): boolean {
  return isAllowedVideoPlaybackHost(hostname);
}

/** Same-origin URL so `<audio src>` streams through our app (auth + host allowlist). */
export function buildSameOriginAudioPlaybackUrl(raw: string, origin: string): string {
  const t = raw.trim();
  if (!t.startsWith("https://")) return t;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return t;
  }
  if (!isAllowedAudioPlaybackHost(u.hostname)) return t;
  const base = origin.replace(/\/$/, "");
  return `${base}/api/audio-playback?url=${encodeURIComponent(t)}`;
}

/** Full-file download through our API (same-origin attachment). */
export function buildAudioDownloadUrl(raw: string, origin: string): string {
  const t = raw.trim();
  if (!t.startsWith("https://")) return t;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return t;
  }
  if (!isAllowedAudioPlaybackHost(u.hostname)) return t;
  const base = origin.replace(/\/$/, "");
  return `${base}/api/audio-download?url=${encodeURIComponent(t)}`;
}

/** Extract canonical URL from `/api/audio-playback?url=`. */
export function extractCanonicalAudioUrlFromProxy(playbackUrl: string): string | null {
  try {
    const u = new URL(playbackUrl, "https://placeholder.local");
    if (!u.pathname.endsWith("/api/audio-playback")) return null;
    const inner = u.searchParams.get("url")?.trim();
    return inner && inner.startsWith("https://") ? inner : null;
  } catch {
    return null;
  }
}
