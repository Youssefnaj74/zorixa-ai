import Stripe from "stripe";

let stripeSingleton: Stripe | undefined;

/** Lazily construct Stripe so importing this module does not throw when STRIPE_SECRET_KEY is unset (e.g. local dev). */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2024-06-20"
    });
  }
  return stripeSingleton;
}
