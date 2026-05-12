/**
 * Normalize an absolute http(s) URL to https for Atlas and other providers
 * that require a publicly reachable https link.
 */
export function coerceToPublicHttpsUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.protocol = "https:";
    return u.href;
  } catch {
    return null;
  }
}
