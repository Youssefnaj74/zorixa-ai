import { sendPurchaseConfirmationEmail } from "@/lib/support-ticket-email";
import { supabaseAdmin } from "@/lib/supabase/admin";

import { creditsForDodoProductId } from "./config";

export type GrantInput = {
  userId: string;
  credits: number;
  orderRef: string;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function readMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | null {
  const v = metadata?.[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function resolveUserId(
  metadata: Record<string, unknown> | undefined,
  customerMeta: Record<string, unknown> | undefined
): string | null {
  return (
    readMetadataString(metadata, "user_id") ??
    readMetadataString(metadata, "userId") ??
    readMetadataString(customerMeta, "user_id") ??
    readMetadataString(customerMeta, "userId")
  );
}

function resolveProductId(data: Record<string, unknown>): string | null {
  if (typeof data.product_id === "string" && data.product_id.trim()) {
    return data.product_id.trim();
  }

  const cart = Array.isArray(data.product_cart) ? data.product_cart : [];
  const first = cart[0];
  if (first && typeof first === "object" && !Array.isArray(first)) {
    const productId = (first as Record<string, unknown>).product_id;
    if (typeof productId === "string" && productId.trim()) return productId.trim();
  }

  return null;
}

function resolveCredits(
  metadata: Record<string, unknown> | undefined,
  productId: string | null
): number {
  let credits = Number(readMetadataString(metadata, "credits"));
  if (Number.isFinite(credits) && credits > 0) return Math.floor(credits);
  if (productId) {
    const fromProduct = creditsForDodoProductId(productId);
    if (fromProduct) return fromProduct;
  }
  return 0;
}

function billingPeriodKey(data: Record<string, unknown>): string {
  for (const key of ["previous_billing_date", "next_billing_date", "created_at", "updated_at"]) {
    const value = data[key];
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "period";
}

/** Dodo fires subscription.renewed on the first charge alongside subscription.active. */
function isInitialSubscriptionPeriod(data: Record<string, unknown>): boolean {
  const createdAt = typeof data.created_at === "string" ? data.created_at.trim() : null;
  const previousBilling =
    typeof data.previous_billing_date === "string" ? data.previous_billing_date.trim() : null;
  if (!createdAt || !previousBilling) return false;
  return createdAt === previousBilling;
}

function baseGrantFromData(
  data: Record<string, unknown>,
  orderRef: string
): GrantInput | null {
  const metadata = asRecord(data.metadata);
  const customer = asRecord(data.customer);
  const customerMeta = asRecord(customer?.metadata);

  const userId = resolveUserId(metadata, customerMeta);
  if (!userId) return null;

  const productId = resolveProductId(data);
  const credits = resolveCredits(metadata, productId);
  if (credits <= 0) return null;

  return { userId, credits, orderRef };
}

/** One-time payments (no subscription_id on payload). */
export function resolveGrantFromPaymentData(data: Record<string, unknown>): GrantInput | null {
  const paymentId = typeof data.payment_id === "string" ? data.payment_id.trim() : null;
  if (!paymentId) return null;

  const subscriptionId =
    typeof data.subscription_id === "string" ? data.subscription_id.trim() : null;
  if (subscriptionId) {
    return null;
  }

  return baseGrantFromData(data, `dodo:payment:${paymentId}`);
}

/** First billing period when a subscription becomes active. */
export function resolveGrantFromSubscriptionActiveData(
  data: Record<string, unknown>
): GrantInput | null {
  const subscriptionId =
    typeof data.subscription_id === "string" ? data.subscription_id.trim() : null;
  if (!subscriptionId) return null;

  return baseGrantFromData(data, `dodo:sub-active:${subscriptionId}`);
}

/** Each subscription renewal period (not the initial charge — see subscription.active). */
export function resolveGrantFromSubscriptionRenewedData(
  data: Record<string, unknown>
): GrantInput | null {
  const subscriptionId =
    typeof data.subscription_id === "string" ? data.subscription_id.trim() : null;
  if (!subscriptionId) return null;

  if (isInitialSubscriptionPeriod(data)) {
    return null;
  }

  const period = billingPeriodKey(data);
  return baseGrantFromData(data, `dodo:sub-renew:${subscriptionId}:${period}`);
}

export async function grantPackCredits(input: GrantInput): Promise<{ duplicate: boolean }> {
  const { userId, credits, orderRef } = input;

  const { data: existing } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("lemonsqueezy_order_id", orderRef)
    .maybeSingle();

  if (existing) return { duplicate: true };

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  if (!profileErr && profile) {
    await supabaseAdmin
      .from("users_profiles")
      .update({ credits_balance: profile.credits_balance + credits })
      .eq("id", userId);
  }

  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "purchase",
    credits_amount: credits,
    lemonsqueezy_order_id: orderRef,
    feature_used: null
  });

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const customerEmail = authUser?.user?.email?.trim();
  if (customerEmail) {
    void sendPurchaseConfirmationEmail({
      email: customerEmail,
      credits,
      orderId: orderRef
    });
  }

  return { duplicate: false };
}
