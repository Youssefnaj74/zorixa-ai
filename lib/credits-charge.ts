import {
  creditsChargedForImageModel,
  creditsChargedForTts,
  creditsChargedForVideoModel
} from "@/lib/atlas-pricing-catalog";
import { supabaseAdmin } from "@/lib/supabase/admin";

export function isCreditsBillingEnabled(): boolean {
  const v = process.env.ZORIXA_CREDITS_DISABLED?.trim().toLowerCase();
  return v !== "1" && v !== "true" && v !== "yes";
}

export function creditsForImageModel(composerModelId: string, quantity = 1): number {
  if (!isCreditsBillingEnabled()) return 0;
  return creditsChargedForImageModel(composerModelId, quantity);
}

export function creditsForVideoModel(composerModelId: string): number {
  if (!isCreditsBillingEnabled()) return 0;
  return creditsChargedForVideoModel(composerModelId);
}

export function creditsForTts(): number {
  if (!isCreditsBillingEnabled()) return 0;
  return creditsChargedForTts();
}

export async function getCreditsBalance(userId: string): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();
  return data?.credits_balance ?? null;
}

export type AffordResult =
  | { ok: true; balance: number }
  | { ok: false; error: "INSUFFICIENT_CREDITS"; balance: number }
  | { ok: false; error: "PROFILE_NOT_FOUND" };

export async function assertCanAfford(userId: string, amount: number): Promise<AffordResult> {
  const balance = await getCreditsBalance(userId);
  if (balance === null) return { ok: false, error: "PROFILE_NOT_FOUND" };
  if (amount > 0 && balance < amount) {
    return { ok: false, error: "INSUFFICIENT_CREDITS", balance };
  }
  return { ok: true, balance };
}

export type DeductCreditsResult =
  | { ok: true; creditsSpent: number; balanceAfter: number; alreadyCharged?: boolean }
  | { ok: false; error: "INSUFFICIENT_CREDITS"; balance: number }
  | { ok: false; error: "PROFILE_NOT_FOUND" }
  | { ok: false; error: "DB_ERROR" };

/**
 * Deduct credits once per Atlas prediction id (idempotent for poll retries).
 * `refKey` is stored on transactions.lemonsqueezy_order_id as `atlas:{refKey}`.
 */
export async function deductCreditsForPrediction(args: {
  userId: string;
  predictionId: string;
  amount: number;
  featureUsed: "enhance" | "video";
}): Promise<DeductCreditsResult> {
  const { userId, predictionId, amount, featureUsed } = args;
  if (amount <= 0) {
    const balance = (await getCreditsBalance(userId)) ?? 0;
    return { ok: true, creditsSpent: 0, balanceAfter: balance };
  }

  const refKey = `atlas:${predictionId}`;
  const { data: existingTx } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("lemonsqueezy_order_id", refKey)
    .maybeSingle();

  if (existingTx) {
    const balance = (await getCreditsBalance(userId)) ?? 0;
    return { ok: true, creditsSpent: 0, balanceAfter: balance, alreadyCharged: true };
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  if (profileErr || !profile) {
    return { ok: false, error: "PROFILE_NOT_FOUND" };
  }

  if (profile.credits_balance < amount) {
    return { ok: false, error: "INSUFFICIENT_CREDITS", balance: profile.credits_balance };
  }

  const balanceAfter = profile.credits_balance - amount;

  const { error: updateErr } = await supabaseAdmin
    .from("users_profiles")
    .update({ credits_balance: balanceAfter })
    .eq("id", userId);

  if (updateErr) {
    return { ok: false, error: "DB_ERROR" };
  }

  const { error: txErr } = await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "usage",
    credits_amount: -amount,
    feature_used: featureUsed,
    lemonsqueezy_order_id: refKey
  });

  if (txErr) {
    return { ok: false, error: "DB_ERROR" };
  }

  return { ok: true, creditsSpent: amount, balanceAfter };
}

/** One-off deduction (TTS, legacy routes) without prediction id. */
export async function deductCredits(args: {
  userId: string;
  amount: number;
  featureUsed: "enhance" | "video";
  refKey?: string;
}): Promise<DeductCreditsResult> {
  const { userId, amount, featureUsed, refKey } = args;
  if (amount <= 0) {
    const balance = (await getCreditsBalance(userId)) ?? 0;
    return { ok: true, creditsSpent: 0, balanceAfter: balance };
  }

  if (refKey) {
    const { data: existingTx } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("lemonsqueezy_order_id", refKey)
      .maybeSingle();
    if (existingTx) {
      const balance = (await getCreditsBalance(userId)) ?? 0;
      return { ok: true, creditsSpent: 0, balanceAfter: balance, alreadyCharged: true };
    }
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  if (profileErr || !profile) {
    return { ok: false, error: "PROFILE_NOT_FOUND" };
  }

  if (profile.credits_balance < amount) {
    return { ok: false, error: "INSUFFICIENT_CREDITS", balance: profile.credits_balance };
  }

  const balanceAfter = profile.credits_balance - amount;

  const { error: updateErr } = await supabaseAdmin
    .from("users_profiles")
    .update({ credits_balance: balanceAfter })
    .eq("id", userId);

  if (updateErr) {
    return { ok: false, error: "DB_ERROR" };
  }

  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "usage",
    credits_amount: -amount,
    feature_used: featureUsed,
    lemonsqueezy_order_id: refKey ?? null
  });

  return { ok: true, creditsSpent: amount, balanceAfter };
}

/** Read usage amount already recorded for an Atlas prediction (async image poll logging). */
export async function lookupCreditsSpentForAtlasPrediction(
  userId: string,
  predictionId: string
): Promise<number> {
  const refKey = `atlas:${predictionId.trim()}`;
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("credits_amount")
    .eq("user_id", userId)
    .eq("lemonsqueezy_order_id", refKey)
    .maybeSingle();
  if (typeof data?.credits_amount === "number") {
    return Math.abs(Math.round(data.credits_amount));
  }
  return 0;
}

/** One-off ref keys (e.g. tts:path). */
export async function lookupCreditsSpentForRef(userId: string, refKey: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("credits_amount")
    .eq("user_id", userId)
    .eq("lemonsqueezy_order_id", refKey)
    .maybeSingle();
  if (typeof data?.credits_amount === "number") {
    return Math.abs(Math.round(data.credits_amount));
  }
  return 0;
}

export function insufficientCreditsResponse(balance: number, required: number) {
  return {
    error: "INSUFFICIENT_CREDITS" as const,
    credits_balance: balance,
    credits_required: required
  };
}
