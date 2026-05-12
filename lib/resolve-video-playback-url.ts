import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";

/**
 * Prepare an Atlas (or CDN) video URL for `<video src>`.
 * - Forces https when possible.
 * - Follows redirects with a tiny ranged GET so `fetch().url` matches what the CDN finally serves.
 * If CORS/network fails, returns the https-normalized original (the `<video>` element may still play it).
 */
export async function resolveAtlasVideoUrlForPlayback(raw: string): Promise<string> {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const base = coerceToPublicHttpsUrl(trimmed) ?? (trimmed.startsWith("http") ? trimmed : "");
  if (!base) return trimmed;

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15_000);
    const res = await fetch(base, {
      method: "GET",
      redirect: "follow",
      mode: "cors",
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
      signal: ac.signal
    });
    clearTimeout(t);
    const final = typeof res.url === "string" && res.url.length > 0 ? res.url : base;
    return final;
  } catch {
    return base;
  }
}

/** Heuristic for logging — many CDNs serve MP4 without `.mp4` in the path. */
export function videoUrlLooksLikeMp4Path(url: string): boolean {
  return /\.mp4(\?|#|$)/i.test(url.trim());
}
