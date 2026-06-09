import { Webhooks } from "@dodopayments/nextjs";

import { getDodoWebhookKey } from "@/lib/dodo-payments/config";
import {
  handleDodoPaymentSucceeded,
  handleDodoSubscriptionActive,
  handleDodoSubscriptionRenewed
} from "@/lib/dodo-payments/webhook-handlers";

const webhookKey = getDodoWebhookKey();

export const POST = webhookKey
  ? Webhooks({
      webhookKey,
      onPaymentSucceeded: handleDodoPaymentSucceeded,
      onSubscriptionActive: handleDodoSubscriptionActive,
      onSubscriptionRenewed: handleDodoSubscriptionRenewed
    })
  : async () =>
      new Response(JSON.stringify({ error: "DODO_PAYMENTS_WEBHOOK_KEY is not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
