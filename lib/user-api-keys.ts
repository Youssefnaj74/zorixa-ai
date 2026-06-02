import { createHash, randomBytes } from "crypto";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const USER_API_KEY_PREFIX = "zrx_live_";
export const MAX_USER_API_KEYS = 5;

export type UserApiKeyRow = {
  id: string;
  user_id: string;
  key_prefix: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export function isUserApiKeyToken(token: string): boolean {
  return token.startsWith(USER_API_KEY_PREFIX) && token.length >= USER_API_KEY_PREFIX.length + 20;
}

export function hashUserApiKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function generateUserApiKey(): string {
  return `${USER_API_KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
}

export function keyPrefixForDisplay(raw: string): string {
  const secret = raw.slice(USER_API_KEY_PREFIX.length);
  return `${USER_API_KEY_PREFIX}${secret.slice(0, 8)}…`;
}

/** Lookup active key → user id; updates last_used_at when matched. */
export async function resolveUserIdFromApiKey(rawKey: string): Promise<string | null> {
  if (!isUserApiKeyToken(rawKey)) return null;

  const keyHash = hashUserApiKey(rawKey);
  const { data, error } = await supabaseAdmin
    .from("user_api_keys")
    .select("id, user_id")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;

  void supabaseAdmin
    .from("user_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data.user_id;
}

export async function countActiveUserApiKeys(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("user_api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error) return MAX_USER_API_KEYS;
  return count ?? 0;
}
