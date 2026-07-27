import {
  grantPackCredits,
  resolveGrantFromPaymentData,
  resolveGrantFromSubscriptionActiveData,
  resolveGrantFromSubscriptionRenewedData,
  type ResolveGrantResult
} from "@/lib/dodo-payments/grant-pack-credits";

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

async function processResolvedGrant(label: string, resolved: ResolveGrantResult) {
  if (resolved.status === "skip") {
    console.info(`[dodo webhook] ${label}: skip`, { reason: resolved.reason });
    return;
  }

  if (resolved.status === "error") {
    console.error(`[dodo webhook] ${label}: unresolved grant`, { reason: resolved.reason });
    throw new Error(`[dodo webhook] ${label}: unresolved grant (${resolved.reason})`);
  }

  const result = await grantPackCredits(resolved.grant);
  console.log(`[dodo webhook] ${label}`, {
    orderRef: resolved.grant.orderRef,
    credits: resolved.grant.credits,
    duplicate: result.duplicate,
    granted: result.granted
  });

  if (result.duplicate) return;
  if (!result.granted) {
    throw new Error(
      `[dodo webhook] ${label}: grant failed for ${resolved.grant.orderRef}`
    );
  }
}

export async function handleDodoPaymentSucceeded(payload: { data?: unknown }) {
  const data = asRecord(payload.data);
  if (!data) {
    throw new Error("[dodo webhook] payment.succeeded: invalid payload data");
  }
  await processResolvedGrant("payment.succeeded", resolveGrantFromPaymentData(data));
}

export async function handleDodoSubscriptionActive(payload: { data?: unknown }) {
  const data = asRecord(payload.data);
  if (!data) {
    throw new Error("[dodo webhook] subscription.active: invalid payload data");
  }
  await processResolvedGrant(
    "subscription.active",
    resolveGrantFromSubscriptionActiveData(data)
  );
}

export async function handleDodoSubscriptionRenewed(payload: { data?: unknown }) {
  const data = asRecord(payload.data);
  if (!data) {
    throw new Error("[dodo webhook] subscription.renewed: invalid payload data");
  }
  await processResolvedGrant(
    "subscription.renewed",
    resolveGrantFromSubscriptionRenewedData(data)
  );
}
