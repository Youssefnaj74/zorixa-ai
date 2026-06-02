import type { SupabaseClient } from "@supabase/supabase-js";

export type LoadedUserProfile = {
  credits_balance: number;
  full_name: string | null;
  is_premium: boolean;
};

/**
 * Loads the signed-in user's profile. Falls back when optional columns (e.g. is_premium) are missing in DB.
 */
export async function loadUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: LoadedUserProfile | null; error: string | null }> {
  const full = await supabase
    .from("users_profiles")
    .select("credits_balance, full_name, is_premium")
    .eq("id", userId)
    .single();

  if (!full.error && full.data) {
    return {
      profile: {
        credits_balance: full.data.credits_balance ?? 0,
        full_name: full.data.full_name ?? null,
        is_premium: full.data.is_premium ?? false
      },
      error: null
    };
  }

  const basic = await supabase
    .from("users_profiles")
    .select("credits_balance, full_name")
    .eq("id", userId)
    .single();

  if (!basic.error && basic.data) {
    return {
      profile: {
        credits_balance: basic.data.credits_balance ?? 0,
        full_name: basic.data.full_name ?? null,
        is_premium: false
      },
      error: null
    };
  }

  const creditsOnly = await supabase
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  if (!creditsOnly.error && creditsOnly.data) {
    return {
      profile: {
        credits_balance: creditsOnly.data.credits_balance ?? 0,
        full_name: null,
        is_premium: false
      },
      error: null
    };
  }

  const message = full.error?.message ?? basic.error?.message ?? creditsOnly.error?.message ?? null;
  return { profile: null, error: message };
}
