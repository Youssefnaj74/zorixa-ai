import {
  creditsChargedForImageModel,
  creditsChargedForVideoModel,
  type ImagePricingOptions,
  type VideoPricingOptions
} from "@/lib/atlas-pricing-catalog";
import { creditsChargedForTts, type TtsPricingOptions } from "@/lib/tts/pricing";
import { supabaseAdmin } from "@/lib/supabase/admin";

export function isCreditsBillingEnabled(): boolean {
  const v = process.env.ZORIXA_CREDITS_DISABLED?.trim().toLowerCase();
  return v !== "1" && v !== "true" && v !== "yes";
}

export function creditsForImageModel(
  composerModelId: string,
  quantity = 1,
  opts: ImagePricingOptions = {}
): number {
  if (!isCreditsBillingEnabled()) return 0;
  return creditsChargedForImageModel(composerModelId, quantity, opts);
}

export function creditsForVideoModel(
  composerModelId: string,
  opts: VideoPricingOptions = {}
): number {
  if (!isCreditsBillingEnabled()) return 0;
  return creditsChargedForVideoModel(composerModelId, opts);
}

export function creditsForTts(opts: TtsPricingOptions): number {
  if (!isCreditsBillingEnabled()) return 0;
  return creditsChargedForTts(opts);
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

type SpendRpcRow = {
  ok?: boolean;
  error?: string;
  balance?: number;
  balance_after?: number;
  credits_spent?: number;
  already_charged?: boolean;
};

function parseSpendRpc(data: unknown): SpendRpcRow | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as SpendRpcRow;
}

function mapSpendRpcToResult(row: SpendRpcRow): DeductCreditsResult {
  if (row.ok === true) {
    return {
      ok: true,
      creditsSpent: typeof row.credits_spent === "number" ? row.credits_spent : 0,
      balanceAfter: typeof row.balance_after === "number" ? row.balance_after : 0,
      alreadyCharged: row.already_charged === true
    };
  }

  if (row.error === "INSUFFICIENT_CREDITS") {
    return {
      ok: false,
      error: "INSUFFICIENT_CREDITS",
      balance: typeof row.balance === "number" ? row.balance : 0
    };
  }

  if (row.error === "NO_PROFILE") {
    return { ok: false, error: "PROFILE_NOT_FOUND" };
  }

  return { ok: false, error: "DB_ERROR" };
}

async function callSpendCreditsRpc(args: {
  userId: string;
  amount: number;
  refKey: string;
  featureUsed: "enhance" | "video";
}): Promise<DeductCreditsResult> {
  const { userId, amount, refKey, featureUsed } = args;
  if (amount <= 0) {
    const balance = (await getCreditsBalance(userId)) ?? 0;
    return { ok: true, creditsSpent: 0, balanceAfter: balance };
  }

  const { data, error } = await supabaseAdmin.rpc("spend_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_ref_key: refKey,
    p_feature: featureUsed
  });

  if (error) {
    if (error.code === "PGRST202") {
      console.error("[credits-charge] spend_credits RPC missing — run P0 migration");
    }
    return { ok: false, error: "DB_ERROR" };
  }

  const row = parseSpendRpc(data);
  if (!row) return { ok: false, error: "DB_ERROR" };
  return mapSpendRpcToResult(row);
}

/** Pending ref generated before Atlas; finalized to `atlas:{predictionId}` after success. */
export function createAtlasPendingRef(): string {
  return `atlas-pending:${crypto.randomUUID()}`;
}

/** Deduct credits before calling Atlas (refund on provider failure). */
export async function spendCreditsBeforeAtlas(args: {
  userId: string;
  amount: number;
  featureUsed: "enhance" | "video";
  pendingRef: string;
}): Promise<DeductCreditsResult> {
  return callSpendCreditsRpc({
    userId: args.userId,
    amount: args.amount,
    refKey: args.pendingRef,
    featureUsed: args.featureUsed
  });
}

/** Refund a pending Atlas charge when the provider call fails. */
export async function refundAtlasPendingCharge(args: {
  userId: string;
  pendingRef: string;
}): Promise<{ ok: boolean }> {
  const { data, error } = await supabaseAdmin.rpc("refund_credits", {
    p_user_id: args.userId,
    p_ref_key: args.pendingRef
  });

  if (error) {
    console.error("[credits-charge] refund_credits failed", error.message);
    return { ok: false };
  }

  const row = data as { ok?: boolean; already_refunded?: boolean } | null;
  return { ok: row?.ok === true || row?.already_refunded === true };
}

/**
 * Refund a finalized `atlas:{predictionId}` charge after Atlas/BytePlus reports failed.
 * Idempotent via `refund:{ref}` unique key inside `refund_credits`.
 */
export async function refundAtlasPredictionCharge(predictionId: string): Promise<{
  ok: boolean;
  userId?: string;
}> {
  const id = predictionId.trim();
  if (!id) return { ok: false };
  const refKey = `atlas:${id}`;

  const { data: usage, error } = await supabaseAdmin
    .from("transactions")
    .select("user_id")
    .eq("lemonsqueezy_order_id", refKey)
    .eq("type", "usage")
    .maybeSingle();

  if (error) {
    console.error("[credits-charge] lookup atlas usage for refund failed", error.message);
    return { ok: false };
  }
  if (!usage?.user_id) return { ok: false };

  const refunded = await refundAtlasPendingCharge({
    userId: usage.user_id,
    pendingRef: refKey
  });
  return { ok: refunded.ok, userId: usage.user_id };
}

export type AtlasChargeSession = {
  pendingRef: string;
  creditsSpent: number;
  balanceAfter: number;
};

/** Reserve credits before Atlas; refund via `abortAtlasCharge` on provider failure. */
export async function beginAtlasCharge(args: {
  userId: string;
  amount: number;
  featureUsed: "enhance" | "video";
}): Promise<
  | { ok: true; session: AtlasChargeSession }
  | Extract<DeductCreditsResult, { ok: false }>
> {
  const pendingRef = createAtlasPendingRef();
  const charge = await spendCreditsBeforeAtlas({
    userId: args.userId,
    amount: args.amount,
    featureUsed: args.featureUsed,
    pendingRef
  });
  if (!charge.ok) return charge;
  return {
    ok: true,
    session: {
      pendingRef,
      creditsSpent: charge.creditsSpent,
      balanceAfter: charge.balanceAfter
    }
  };
}

export async function completeAtlasCharge(args: {
  userId: string;
  session: AtlasChargeSession;
  predictionId: string;
}): Promise<{ ok: boolean }> {
  return finalizeAtlasCharge({
    userId: args.userId,
    pendingRef: args.session.pendingRef,
    predictionId: args.predictionId
  });
}

export async function abortAtlasCharge(args: {
  userId: string;
  session: AtlasChargeSession;
}): Promise<void> {
  await refundAtlasPendingCharge({
    userId: args.userId,
    pendingRef: args.session.pendingRef
  });
}

/** Link pending charge to Atlas prediction id for poll idempotency. */
export async function finalizeAtlasCharge(args: {
  userId: string;
  pendingRef: string;
  predictionId: string;
}): Promise<{ ok: boolean }> {
  const finalRef = `atlas:${args.predictionId.trim()}`;
  const { data, error } = await supabaseAdmin.rpc("finalize_credit_ref", {
    p_user_id: args.userId,
    p_pending_ref: args.pendingRef,
    p_final_ref: finalRef
  });

  if (error) {
    console.error("[credits-charge] finalize_credit_ref failed", error.message);
    return { ok: false };
  }

  const row = data as { ok?: boolean; already_finalized?: boolean } | null;
  return { ok: row?.ok === true || row?.already_finalized === true };
}

/**
 * Deduct credits once per Atlas prediction id (idempotent for poll retries).
 * `refKey` is stored on transactions.lemonsqueezy_order_id as `atlas:{predictionId}`.
 */
export async function deductCreditsForPrediction(args: {
  userId: string;
  predictionId: string;
  amount: number;
  featureUsed: "enhance" | "video";
}): Promise<DeductCreditsResult> {
  const refKey = `atlas:${args.predictionId}`;
  return callSpendCreditsRpc({
    userId: args.userId,
    amount: args.amount,
    refKey,
    featureUsed: args.featureUsed
  });
}

/** One-off deduction (TTS, legacy routes) without prediction id. */
export async function deductCredits(args: {
  userId: string;
  amount: number;
  featureUsed: "enhance" | "video";
  refKey?: string;
}): Promise<DeductCreditsResult> {
  const refKey = args.refKey ?? `usage:${crypto.randomUUID()}`;
  return callSpendCreditsRpc({
    userId: args.userId,
    amount: args.amount,
    refKey,
    featureUsed: args.featureUsed
  });
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
