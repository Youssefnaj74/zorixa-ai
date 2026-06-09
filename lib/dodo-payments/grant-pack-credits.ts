import { sendPurchaseConfirmationEmail } from "@/lib/support-ticket-email";
import { supabaseAdmin } from "@/lib/supabase/admin";

import { creditsForDodoProductId } from "./config";

export type GrantInput = {
  userId: string;
  credits: number;
  orderRef: string;
};

function readMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | null {
  const v = metadata?.[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function metadataFromData(data: Record<string, unknown>): Record<string, unknown> | undefined {
  if (data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)) {
    return data.metadata as Record<string, unknown>;
  }
  return undefined;
}

function customerMetadataFromData(data: Record<string, unknown>): Record<string, unknown> | undefined {
  const customer =
    data.customer && typeof data.customer === "object" && !Array.isArray(data.customer)
      ? (data.customer as Record<string, unknown>)
      : undefined;
  if (
    customer?.metadata &&
    typeof customer.metadata === "object" &&
    !Array.isArray(customer.metadata)
  ) {
    return customer.metadata as Record<string, unknown>;
  }
  return undefined;
}

function extractUserId(data: Record<string, unknown>): string | null {
  const metadata = metadataFromData(data);
  const customerMeta = customerMetadataFromData(data);
  return (
    readMetadataString(metadata, "user_id") ??
    readMetadataString(metadata, "userId") ??
    readMetadataString(customerMeta, "user_id") ??
    readMetadataString(customerMeta, "userId")
  );
}

function extractProductId(data: Record<string, unknown>): string | null {
  if (typeof data.product_id === "string" && data.product_id.trim()) {
    return data.product_id.trim();
  }
  const cart = Array.isArray(data.product_cart) ? data.product_cart : [];
  const first = cart[0];
  if (first && typeof first === "object" && !Array.isArray(first) && typeof first.product_id === "string") {
    return first.product_id.trim();
  }
  return null;
}

function resolveCredits(data: Record<string, unknown>): number {
  const metadata = metadataFromData(data);
  let credits = Number(readMetadataString(metadata, "credits"));
  if (Number.isFinite(credits) && credits > 0) return Math.floor(credits);

  const productId = extractProductId(data);
  if (productId) {
    credits = creditsForDodoProductId(productId) ?? 0;
    if (credits > 0) return credits;
  }
  return 0;
}

function dateToCycleKey(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return value.trim().slice(0, 10);
  }
  return null;
}

/** One ref per subscription billing cycle — avoids double credit on payment + subscription events. */
function billingCycleOrderRef(data: Record<string, unknown>): string | null {
  const subscriptionId =
    typeof data.subscription_id === "string" ? data.subscription_id.trim() : null;
  if (!subscriptionId) return null;

  const cycleKey =
    dateToCycleKey(data.previous_billing_date) ??
    dateToCycleKey(data.next_billing_date) ??
    dateToCycleKey(data.created_at);

  if (!cycleKey) return null;
  return `dodo:cycle:${subscriptionId}:${cycleKey}`;
}

function buildGrant(
  data: Record<string, unknown>,
  orderRef: string
): GrantInput | null {
  const userId = extractUserId(data);
  const credits = resolveCredits(data);
  if (!userId || credits <= 0) return null;
  return { userId, credits, orderRef };
}

/** payment.succeeded — initial charge and renewals. */
export function resolveGrantFromPaymentData(data: Record<string, unknown>): GrantInput | null {
  const paymentId = typeof data.payment_id === "string" ? data.payment_id.trim() : null;
  if (!paymentId) return null;

  const cycleRef = billingCycleOrderRef(data);
  const orderRef = cycleRef ?? `dodo:pay:${paymentId}`;
  return buildGrant(data, orderRef);
}

/** subscription.active — first activation (same cycle ref as first payment when possible). */
export function resolveGrantFromSubscriptionActiveData(
  data: Record<string, unknown>
): GrantInput | null {
  const subscriptionId =
    typeof data.subscription_id === "string" ? data.subscription_id.trim() : null;
  if (!subscriptionId) return null;

  const orderRef =
    billingCycleOrderRef(data) ?? `dodo:sub-active:${subscriptionId}:${dateToCycleKey(data.created_at) ?? "start"}`;

  return buildGrant(data, orderRef);
}

/** subscription.renewed — monthly renewal credits. */
export function resolveGrantFromSubscriptionRenewedData(
  data: Record<string, unknown>
): GrantInput | null {
  const subscriptionId =
    typeof data.subscription_id === "string" ? data.subscription_id.trim() : null;
  if (!subscriptionId) return null;

  const orderRef =
    billingCycleOrderRef(data) ??
    `dodo:sub-renew:${subscriptionId}:${dateToCycleKey(data.previous_billing_date) ?? "renew"}`;

  return buildGrant(data, orderRef);
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
    .select("credits_balance, is_premium")
    .eq("id", userId)
    .single();

  if (!profileErr && profile) {
    await supabaseAdmin
      .from("users_profiles")
      .update({
        credits_balance: profile.credits_balance + credits,
        is_premium: true
      })
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
