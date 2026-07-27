import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimitAsync } from "@/lib/rate-limit";

export const TRIAL_CREDITS_AMOUNT = 100;

export type TrialGrantStatus =
  | "granted"
  | "already_granted"
  | "unverified"
  | "user_not_found"
  | "invalid"
  | "rate_limited"
  | "error";

/**
 * Idempotent: grants trial credits once the auth email is verified.
 * IP rate limit applies only to *new* grants (anti multi-account farming).
 */
export async function grantTrialCreditsIfEligible(args: {
  userId: string;
  ip?: string | null;
}): Promise<{ status: TrialGrantStatus }> {
  const userId = args.userId.trim();
  if (!userId) return { status: "invalid" };

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users_profiles")
    .select("trial_credits_granted_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    console.error("[trial-credits] profile read failed", profileErr.message);
    return { status: "error" };
  }

  if (profile?.trial_credits_granted_at) {
    return { status: "already_granted" };
  }

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (authErr || !authData?.user) {
    return { status: "user_not_found" };
  }
  if (!authData.user.email_confirmed_at) {
    return { status: "unverified" };
  }

  if (args.ip) {
    const rl = await rateLimitAsync({
      key: `trial-grant:${args.ip}`,
      limit: 3,
      windowMs: 24 * 60 * 60_000
    });
    if (!rl.ok) {
      console.warn("[trial-credits] IP rate limited", { userId, ip: args.ip });
      return { status: "rate_limited" };
    }
  }

  const { data, error } = await supabaseAdmin.rpc("grant_trial_credits_if_eligible", {
    p_user_id: userId
  });

  if (error) {
    console.error("[trial-credits] RPC failed", error.message);
    return { status: "error" };
  }

  const status = typeof data === "string" ? data : "error";
  if (
    status === "granted" ||
    status === "already_granted" ||
    status === "unverified" ||
    status === "user_not_found" ||
    status === "invalid"
  ) {
    return { status };
  }
  return { status: "error" };
}
