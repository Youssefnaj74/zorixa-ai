/**
 * Shared security headers for next.config.mjs and proxy.ts (Next.js 16 middleware).
 * Keep a single source of truth so Vercel serves identical headers on every route.
 */

/** @typedef {{ key: string, value: string }} SecurityHeader */

/** @param {string | undefined} raw */
function originFromEnvUrl(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

/** @param {Array<string | null | undefined>} values */
function unique(values) {
  return [...new Set(values.filter((value) => Boolean(value)))];
}

function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV !== "production";
  const supabaseOrigin = originFromEnvUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const posthogOrigin =
    originFromEnvUrl(process.env.NEXT_PUBLIC_POSTHOG_HOST) ?? "https://us.i.posthog.com";

  const connectSrc = unique([
    "'self'",
    supabaseOrigin,
    supabaseOrigin?.replace(/^https:/, "wss:"),
    posthogOrigin,
    "https://us.posthog.com",
    "https://eu.i.posthog.com",
    "https://eu.posthog.com",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://www.googletagmanager.com"
  ]);

  const imgSrc = unique([
    "'self'",
    "data:",
    "blob:",
    supabaseOrigin,
    "https://*.supabase.co",
    "https://*.supabase.in",
    "https://*.aliyuncs.com",
    "https://*.atlascloud.ai",
    "https://*.amazonaws.com",
    "https://*.cloudfront.net",
    "https://*.googleusercontent.com",
    "https://*.blob.vercel-storage.com",
    "https://placehold.co",
    "https://picsum.photos",
    "https://images.unsplash.com",
    "https://api.producthunt.com",
    "https://launchbuff.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com"
  ]);

  const scriptSrc = unique([
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : null,
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://us-assets.i.posthog.com",
    "https://eu-assets.i.posthog.com",
    "https://tally.so"
  ]);

  /** @type {[string, string[]][]} */
  const directives = [
    ["default-src", ["'self'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'self'"]],
    ["object-src", ["'none'"]],
    ["script-src", scriptSrc],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", imgSrc],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", connectSrc],
    ["media-src", ["'self'", "blob:"]],
    ["worker-src", ["'self'", "blob:"]],
    ["frame-src", ["'self'", "https://www.producthunt.com", "https://tally.so"]],
    ["manifest-src", ["'self'"]]
  ];

  if (!isDev) {
    directives.push(["upgrade-insecure-requests", []]);
  }

  return directives
    .map(([name, values]) => (values.length > 0 ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "autoplay=(self)",
  "camera=()",
  "display-capture=()",
  "encrypted-media=(self)",
  "fullscreen=(self)",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "picture-in-picture=(self)",
  "publickey-credentials-get=(self)",
  "screen-wake-lock=()",
  "usb=()",
  "web-share=(self)",
  "xr-spatial-tracking=()"
].join(", ");

/** @returns {SecurityHeader[]} */
export function getSecurityHeaders() {
  /** @type {SecurityHeader[]} */
  const headers = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
    { key: "X-DNS-Prefetch-Control", value: "on" }
  ];

  if (process.env.NODE_ENV === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload"
    });
  }

  return headers;
}

/** @template {Response} T @param {T} response @returns {T} */
export function applySecurityHeaders(response) {
  for (const { key, value } of getSecurityHeaders()) {
    response.headers.set(key, value);
  }
  return response;
}
