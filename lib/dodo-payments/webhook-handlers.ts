import {
  grantPackCredits,
  resolveGrantFromPaymentData,
  resolveGrantFromSubscriptionActiveData,
  resolveGrantFromSubscriptionRenewedData
} from "@/lib/dodo-payments/grant-pack-credits";

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

export async function handleDodoPaymentSucceeded(payload: { data?: unknown }) {
  const data = asRecord(payload.data);
  if (!data) return;

  const grant = resolveGrantFromPaymentData(data);
  if (!grant) {
    console.warn("[dodo webhook] payment.succeeded — could not resolve grant", {
      payment_id: data.payment_id,
      subscription_id: data.subscription_id
    });
    return;
  }

  const result = await grantPackCredits(grant);
  console.log("[dodo webhook] payment.succeeded", {
    orderRef: grant.orderRef,
    credits: grant.credits,
    duplicate: result.duplicate
  });
}

export async function handleDodoSubscriptionActive(payload: { data?: unknown }) {
  const data = asRecord(payload.data);
  if (!data) return;

  const grant = resolveGrantFromSubscriptionActiveData(data);
  if (!grant) {
    console.warn("[dodo webhook] subscription.active — could not resolve grant", {
      subscription_id: data.subscription_id
    });
    return;
  }

  const result = await grantPackCredits(grant);
  console.log("[dodo webhook] subscription.active", {
    orderRef: grant.orderRef,
    credits: grant.credits,
    duplicate: result.duplicate
  });
}

export async function handleDodoSubscriptionRenewed(payload: { data?: unknown }) {
  const data = asRecord(payload.data);
  if (!data) return;

  const grant = resolveGrantFromSubscriptionRenewedData(data);
  if (!grant) {
    console.warn("[dodo webhook] subscription.renewed — could not resolve grant", {
      subscription_id: data.subscription_id
    });
    return;
  }

  const result = await grantPackCredits(grant);
  console.log("[dodo webhook] subscription.renewed", {
    orderRef: grant.orderRef,
    credits: grant.credits,
    duplicate: result.duplicate
  });
}
