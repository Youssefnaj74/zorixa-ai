import { Webhooks } from "@dodopayments/nextjs";

import { getDodoWebhookKey } from "@/lib/dodo-payments/config";
import {
  grantPackCredits,
  resolveGrantFromPaymentData,
  resolveGrantFromSubscriptionActiveData,
  resolveGrantFromSubscriptionRenewedData
} from "@/lib/dodo-payments/grant-pack-credits";

const webhookKey = getDodoWebhookKey();

async function processGrant(
  label: string,
  data: unknown,
  resolve: (data: Record<string, unknown>) => ReturnType<typeof resolveGrantFromPaymentData>
) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return;
  const grant = resolve(data as Record<string, unknown>);
  if (!grant) {
    console.warn(`[dodo-webhook] ${label}: no grant resolved`, {
      keys: Object.keys(data as object).slice(0, 12)
    });
    return;
  }
  const result = await grantPackCredits(grant);
  console.info(`[dodo-webhook] ${label}`, {
    orderRef: grant.orderRef,
    credits: grant.credits,
    duplicate: result.duplicate
  });
}

export const POST = webhookKey
  ? Webhooks({
      webhookKey,
      onPaymentSucceeded: async (payload) => {
        await processGrant("payment.succeeded", payload.data, resolveGrantFromPaymentData);
      },
      onSubscriptionActive: async (payload) => {
        await processGrant("subscription.active", payload.data, resolveGrantFromSubscriptionActiveData);
      },
      onSubscriptionRenewed: async (payload) => {
        await processGrant("subscription.renewed", payload.data, resolveGrantFromSubscriptionRenewedData);
      }
    })
  : async () =>
      new Response(JSON.stringify({ error: "DODO_PAYMENTS_WEBHOOK_KEY is not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
