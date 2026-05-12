import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";

/**
 * Prepare an Atlas / CDN video URL for `<video src>` **without any network request**.
 *
 * Do **not** pre-fetch the URL (Range GET, HEAD, etc.): many storage/CDN links are
 * **single-use or token-bound** — the first request can invalidate the URL and leave
 * the `<video>` element with a dead `src` (black player at 0:00).
 *
 * We only trim and upgrade `http:` → `https:` when `coerceToPublicHttpsUrl` applies.
 */
export function normalizeAtlasVideoUrlForPlayback(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const upgraded = coerceToPublicHttpsUrl(trimmed);
  if (upgraded) return upgraded;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return trimmed;
}

/** Heuristic for logging — many CDNs serve MP4 without `.mp4` in the path. */
export function videoUrlLooksLikeMp4Path(url: string): boolean {
  return /\.mp4(\?|#|$)/i.test(url.trim());
}
