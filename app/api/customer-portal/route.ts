import { CustomerPortal } from "@dodopayments/nextjs";

import { dodoPaymentsEnvironment, getDodoApiKey } from "@/lib/dodo-payments/config";

const apiKey = getDodoApiKey();

/** Dodo customer portal — manage subscription / billing (pass ?customer_id=cus_…). */
export const GET = apiKey
  ? CustomerPortal({
      bearerToken: apiKey,
      environment: dodoPaymentsEnvironment()
    })
  : async () =>
      new Response(JSON.stringify({ error: "DODO_PAYMENTS_API_KEY is not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
