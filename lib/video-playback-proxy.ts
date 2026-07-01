/** Headers for server-side fetch to Atlas / Aliyun OSS (no browser Referer). */
export function atlasCdnUpstreamFetchHeaders(
  purpose: "playback" | "download"
): Record<string, string> {
  return {
    Accept: "video/*,*/*;q=0.8",
    "User-Agent": purpose === "download" ? "ZorixaVideoDownload/1.0" : "ZorixaVideoPlayback/1.0"
    // Intentionally omit Referer — OSS referer policy blocks browser nav from zorixaai.com
  };
}

/** Hosts we allow streaming through `/api/video-playback` (open redirect guard). */
export function isAllowedVideoPlaybackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "api.atlascloud.ai" ||
    h.endsWith(".atlascloud.ai") ||
    h.endsWith(".amazonaws.com") ||
    h.endsWith(".cloudfront.net") ||
    h.endsWith(".supabase.co") ||
    h.endsWith(".supabase.in") ||
    h.endsWith(".r2.cloudflarestorage.com") ||
    h === "public.blob.vercel-storage.com" ||
    h.endsWith(".blob.vercel-storage.com") ||
    h.endsWith(".googleusercontent.com") ||
    /** Atlas / ByteDance outputs often land on Aliyun OSS */
    h.endsWith(".aliyuncs.com") ||
    /** BytePlus Seedance outputs (Volcengine TOS) */
    h.endsWith(".volces.com")
  );
}

/**
 * Same-origin URL so `<video src>` hits our app (`/api/video-playback`), which **streams**
 * bytes from the CDN (auth + host allowlist). Falls back to `raw` when not https or host not allowlisted.
 */
export function buildSameOriginVideoPlaybackUrl(raw: string, origin: string): string {
  const t = raw.trim();
  if (!t.startsWith("https://")) return t;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return t;
  }
  if (!isAllowedVideoPlaybackHost(u.hostname)) return t;
  const base = origin.replace(/\/$/, "");
  return `${base}/api/video-playback?url=${encodeURIComponent(t)}`;
}

/** Full-file download through our API (never forwards Range — avoids corrupt saves). */
export function buildVideoDownloadUrl(raw: string, origin: string): string {
  const t = raw.trim();
  if (!t.startsWith("https://")) return t;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return t;
  }
  if (!isAllowedVideoPlaybackHost(u.hostname)) return t;
  const base = origin.replace(/\/$/, "");
  return `${base}/api/video-download?url=${encodeURIComponent(t)}`;
}

/** Extract canonical CDN URL from a `/api/video-playback?url=` same-origin link. */
export function extractCanonicalVideoUrlFromProxy(playbackUrl: string): string | null {
  try {
    const u = new URL(playbackUrl, "https://placeholder.local");
    if (!u.pathname.endsWith("/api/video-playback") && !u.pathname.endsWith("/api/video-download")) {
      return null;
    }
    const inner = u.searchParams.get("url")?.trim();
    return inner && inner.startsWith("https://") ? inner : null;
  } catch {
    return null;
  }
}
