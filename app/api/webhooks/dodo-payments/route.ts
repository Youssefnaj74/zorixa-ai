import { Webhooks } from "@dodopayments/nextjs";

import { getDodoWebhookKey } from "@/lib/dodo-payments/config";
import {
  grantPackCredits,
  resolveGrantFromPaymentData,
  resolveGrantFromSubscriptionActiveData,
  resolveGrantFromSubscriptionRenewedData,
  type ResolveGrantResult
} from "@/lib/dodo-payments/grant-pack-credits";
import { captureException } from "@/lib/report-error";

const webhookKey = getDodoWebhookKey();

/**
 * Throw on unresolved/failed grants so Dodo retries (non-2xx) instead of silently
 * ACKing a paid event with zero credits fulfilled.
 */
async function processGrant(
  label: string,
  data: unknown,
  resolve: (data: Record<string, unknown>) => ResolveGrantResult
) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`[dodo-webhook] ${label}: invalid payload data`);
  }

  const resolved = resolve(data as Record<string, unknown>);

  if (resolved.status === "skip") {
    console.info(`[dodo-webhook] ${label}: skip`, { reason: resolved.reason });
    return;
  }

  if (resolved.status === "error") {
    const err = new Error(`[dodo-webhook] ${label}: unresolved grant (${resolved.reason})`);
    captureException(err, {
      label,
      reason: resolved.reason,
      keys: Object.keys(data as object).slice(0, 12)
    });
    throw err;
  }

  const { grant } = resolved;
  const result = await grantPackCredits(grant);

  console.info(`[dodo-webhook] ${label}`, {
    orderRef: grant.orderRef,
    credits: grant.credits,
    duplicate: result.duplicate,
    granted: result.granted
  });

  if (result.duplicate) return;

  if (!result.granted) {
    const err = new Error(
      `[dodo-webhook] ${label}: grant failed for ${grant.orderRef} (${grant.credits} credits)`
    );
    captureException(err, {
      label,
      orderRef: grant.orderRef,
      credits: grant.credits,
      userId: grant.userId
    });
    throw err;
  }
}

export const POST = webhookKey
  ? Webhooks({
      webhookKey,
      onPaymentSucceeded: async (payload) => {
        await processGrant("payment.succeeded", payload.data, resolveGrantFromPaymentData);
      },
      onSubscriptionActive: async (payload) => {
        await processGrant(
          "subscription.active",
          payload.data,
          resolveGrantFromSubscriptionActiveData
        );
      },
      onSubscriptionRenewed: async (payload) => {
        await processGrant(
          "subscription.renewed",
          payload.data,
          resolveGrantFromSubscriptionRenewedData
        );
      }
    })
  : async () =>
      new Response(JSON.stringify({ error: "DODO_PAYMENTS_WEBHOOK_KEY is not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
