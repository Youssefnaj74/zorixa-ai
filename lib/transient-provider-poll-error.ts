/**
 * Provider/gateway glitches (HTML error pages, timeouts) must not be treated as
 * terminal Atlas "failed" — the job may still complete on retry.
 */
export function isTransientProviderPollError(message: string | null | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("unexpected token") ||
    m.includes("<!doctype") ||
    m.includes("not valid json") ||
    m.includes("non-json") ||
    m.includes("html error page") ||
    m.includes("html instead of json") ||
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("econnreset") ||
    m.includes("etimedout") ||
    m.includes("socket hang up") ||
    m.includes("cloudflare") ||
    m.includes("bad gateway") ||
    m.includes("service unavailable") ||
    m.includes("gateway timeout") ||
    /\b(502|503|504)\b/.test(m)
  );
}
