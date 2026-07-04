/** Production canonical origin — all zorixaai.com metadata and redirects target www. */
export const CANONICAL_SITE_ORIGIN = "https://www.zorixaai.com";

/**
 * Canonical site origin for OAuth redirects, billing return URLs, and metadata.
 * Uses NEXT_PUBLIC_SITE_URL, then NEXT_PUBLIC_APP_URL, then localhost for local dev.
 * Production zorixaai.com hostnames are always normalized to https://www.zorixaai.com.
 */
export function getPublicSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";

  const normalized = normalizeSiteOrigin(raw);
  if (normalized) {
    return normalized;
  }

  if (process.env.NODE_ENV === "production") {
    return CANONICAL_SITE_ORIGIN;
  }

  return "http://localhost:3000";
}

function normalizeSiteOrigin(raw: string): string {
  const base = raw.replace(/\/+$/, "");
  if (!base) {
    return "";
  }

  try {
    const url = new URL(base);
    if (url.hostname === "zorixaai.com" || url.hostname === "www.zorixaai.com") {
      return CANONICAL_SITE_ORIGIN;
    }
    return url.origin;
  } catch {
    return base;
  }
}
