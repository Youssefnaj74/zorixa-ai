import { Checkout } from "@dodopayments/nextjs";

import { dodoPaymentsEnvironment, getDodoApiKey, getDodoReturnUrl } from "@/lib/dodo-payments/config";

const apiKey = getDodoApiKey();

export const GET = apiKey
  ? Checkout({
      bearerToken: apiKey,
      returnUrl: getDodoReturnUrl(),
      environment: dodoPaymentsEnvironment(),
      type: "static"
    })
  : async () =>
      new Response(JSON.stringify({ error: "DODO_PAYMENTS_API_KEY is not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });

export const POST = apiKey
  ? Checkout({
      bearerToken: apiKey,
      returnUrl: getDodoReturnUrl(),
      environment: dodoPaymentsEnvironment(),
      type: "session"
    })
  : async () =>
      new Response(JSON.stringify({ error: "DODO_PAYMENTS_API_KEY is not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
