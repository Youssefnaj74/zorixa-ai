/**
 * Free trial credits are disabled — replaced by the one-time Starter Pass ($1.10).
 * Kept as a no-op so older call sites / RPC remain harmless.
 */

export const TRIAL_CREDITS_AMOUNT = 0;

export type TrialGrantStatus =
  | "granted"
  | "already_granted"
  | "unverified"
  | "user_not_found"
  | "invalid"
  | "rate_limited"
  | "disabled"
  | "error";

/** @deprecated Free trial removed — use Starter Pass checkout instead. */
export async function grantTrialCreditsIfEligible(_args: {
  userId: string;
  ip?: string | null;
}): Promise<{ status: TrialGrantStatus }> {
  return { status: "disabled" };
}
