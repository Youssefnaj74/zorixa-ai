import { getPublicSiteUrl } from "./public-site-url";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function envTrim(name: string): string {
  return process.env[name]?.trim() ?? "";
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
  supabase: {
    url: envTrim("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: envTrim("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: envTrim("SUPABASE_SERVICE_ROLE_KEY")
  },
  required
};

