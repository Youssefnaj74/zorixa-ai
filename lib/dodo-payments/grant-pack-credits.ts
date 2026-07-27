import { sendPurchaseConfirmationEmail } from "@/lib/support-ticket-email";
import { trackPaymentGrantAnalytics } from "@/lib/analytics-server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureUserProfile } from "@/lib/users/ensure-user-profile";

import type { GrantInput } from "./resolve-grant";

export type { GrantInput, ResolveGrantResult } from "./resolve-grant";
export {
  grantInputFromResolveResult,
  resolveGrantFromPaymentData,
  resolveGrantFromSubscriptionActiveData,
  resolveGrantFromSubscriptionRenewedData
} from "./resolve-grant";

type GrantPurchaseResult = "granted" | "duplicate" | "no_profile" | "invalid" | "error";

function isGrantRpcMissing(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "PGRST202" || Boolean(error?.message?.includes("grant_purchase_credits"));
}

async function grantPackCreditsFallback(
  input: GrantInput
): Promise<{ duplicate: boolean; granted: boolean }> {
  const { userId, credits, orderRef } = input;

  const { error: insertErr } = await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "purchase",
    credits_amount: credits,
    lemonsqueezy_order_id: orderRef,
    feature_used: null
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return { duplicate: true, granted: false };
    }
    console.error("[grantPackCredits] fallback insert failed", insertErr);
    return { duplicate: false, granted: false };
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  if (profileErr || !profile) {
    console.error("[grantPackCredits] fallback profile read failed", { userId, orderRef });
    return { duplicate: false, granted: false };
  }

  const { error: updateErr } = await supabaseAdmin
    .from("users_profiles")
    .update({
      credits_balance: profile.credits_balance + credits,
      is_premium: true,
      ...(input.packId === "starter-pass"
        ? { starter_pass_purchased_at: new Date().toISOString() }
        : {})
    })
    .eq("id", userId);

  if (updateErr) {
    console.error("[grantPackCredits] fallback balance update failed", updateErr);
    return { duplicate: false, granted: false };
  }

  void trackPaymentGrantAnalytics({
    userId,
    credits,
    orderRef,
    isPremiumUpdated: true
  });

  return { duplicate: false, granted: true };
}

export async function grantPackCredits(
  input: GrantInput
): Promise<{ duplicate: boolean; granted: boolean }> {
  const { userId, credits, orderRef } = input;

  const profileReady = await ensureUserProfile(userId);
  if (!profileReady.ok) {
    console.error("[grantPackCredits] ensureUserProfile failed", {
      userId,
      orderRef,
      error: profileReady.error
    });
    return { duplicate: false, granted: false };
  }

  const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc("grant_purchase_credits", {
    p_user_id: userId,
    p_credits: credits,
    p_order_ref: orderRef
  });

  if (rpcErr && isGrantRpcMissing(rpcErr)) {
    console.warn("[grantPackCredits] RPC missing — using insert-first fallback (apply DB migration)");
    const fallback = await grantPackCreditsFallback(input);
    if (fallback.granted) {
      await sendGrantConfirmationEmail(userId, credits, orderRef);
    }
    return fallback;
  }

  const status = (typeof rpcResult === "string" ? rpcResult : null) as GrantPurchaseResult | null;

  if (rpcErr) {
    if (rpcErr.code === "23505") {
      return { duplicate: true, granted: false };
    }
    console.error("[grantPackCredits] grant_purchase_credits failed", {
      userId,
      orderRef,
      error: rpcErr.message,
      code: rpcErr.code
    });
    return { duplicate: false, granted: false };
  }

  if (status === "duplicate") {
    return { duplicate: true, granted: false };
  }

  if (status !== "granted") {
    console.error("[grantPackCredits] unexpected grant status", { userId, orderRef, status });
    return { duplicate: false, granted: false };
  }

  const premiumUpdated = await markUserPremium(userId, input.packId);
  await sendGrantConfirmationEmail(userId, credits, orderRef);
  void trackPaymentGrantAnalytics({
    userId,
    credits,
    orderRef,
    isPremiumUpdated: premiumUpdated
  });
  return { duplicate: false, granted: true };
}

async function markUserPremium(
  userId: string,
  packId?: GrantInput["packId"]
): Promise<boolean> {
  const patch: { is_premium: boolean; starter_pass_purchased_at?: string } = {
    is_premium: true
  };
  if (packId === "starter-pass") {
    patch.starter_pass_purchased_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin.from("users_profiles").update(patch).eq("id", userId);
  if (error) {
    console.warn("[grantPackCredits] is_premium update failed", { userId, error: error.message });
    return false;
  }
  return true;
}

async function sendGrantConfirmationEmail(userId: string, credits: number, orderRef: string) {
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const customerEmail = authUser?.user?.email?.trim();
  if (customerEmail) {
    void sendPurchaseConfirmationEmail({
      email: customerEmail,
      credits,
      orderId: orderRef
    });
  }
}
