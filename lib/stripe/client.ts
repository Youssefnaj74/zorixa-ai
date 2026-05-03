import { loadStripe } from "@stripe/stripe-js";

import { env } from "@/lib/env";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripeJs() {
  if (!stripePromise) {
    stripePromise = loadStripe(env.required("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"));
  }
  return stripePromise;
}

