import { getPublicSiteUrl } from "./public-site-url";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function envTrim(name: string): string {
  return process.env[name]?.trim() ?? "";
}

/**
 * Atlas Cloud REST API key (`https://api.atlascloud.ai`).
 * **Only** `ATLASCLOUD_API_KEY` is read — no `ATLAS_API_KEY` / `ATLAS_CLOUD_*` fallbacks (matches Vercel naming).
 */
export function requireAtlasCloudApiKey(): string {
  return required("ATLASCLOUD_API_KEY");
}

/** ElevenLabs REST API key for text-to-speech (`https://api.elevenlabs.io`). */
export function requireElevenLabsApiKey(): string {
  return required("ELEVENLABS_API_KEY");
}

/** Validates `NEXT_PUBLIC_SUPABASE_*` before creating any Supabase client. */
export function requirePublicSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase configuration: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }
  return { url, anonKey };
}

export const env = {
  /** Same resolution as getPublicSiteUrl — prefer NEXT_PUBLIC_SITE_URL. */
  siteUrl: getPublicSiteUrl(),
  appUrl: getPublicSiteUrl(),
  /** Trimmed `ATLASCLOUD_API_KEY` (empty string if unset). Prefer `requireAtlasCloudApiKey()` when the key is required. */
  atlasCloudApiKey: envTrim("ATLASCLOUD_API_KEY"),
  /** Shared secret for Cursor MCP → Zorixa API (see zorixa-mcp/). */
  zorixaMcpApiKey: envTrim("ZORIXA_MCP_API_KEY"),
  /** Trimmed `ELEVENLABS_API_KEY` (empty if unset). Prefer `requireElevenLabsApiKey()` when required. */
  elevenLabsApiKey: envTrim("ELEVENLABS_API_KEY"),
  supabase: {
    url: envTrim("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: envTrim("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: envTrim("SUPABASE_SERVICE_ROLE_KEY")
  },
  required
};

