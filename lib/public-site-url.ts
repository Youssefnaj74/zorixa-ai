/**
 * Canonical site origin for OAuth redirects, billing return URLs, and metadata.
 * Uses NEXT_PUBLIC_SITE_URL, then NEXT_PUBLIC_APP_URL, then localhost for local dev.
 */
export function getPublicSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  const base = raw.replace(/\/+$/, "");
  return base || "http://localhost:3000";
}
