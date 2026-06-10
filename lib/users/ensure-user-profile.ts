import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Ensures users_profiles exists for a Supabase auth user (signup trigger fallback).
 */
export async function ensureUserProfile(userId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: existing, error: readErr } = await supabaseAdmin
    .from("users_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (readErr) {
    return { ok: false, error: readErr.message };
  }

  if (existing) return { ok: true };

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (authErr || !authData?.user) {
    return { ok: false, error: authErr?.message ?? "USER_NOT_FOUND" };
  }

  const user = authData.user;
  const fullName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : null;

  const { error: upsertErr } = await supabaseAdmin.from("users_profiles").upsert(
    {
      id: userId,
      email: user.email ?? null,
      full_name: fullName
    },
    { onConflict: "id" }
  );

  if (upsertErr) {
    return { ok: false, error: upsertErr.message };
  }

  return { ok: true };
}
