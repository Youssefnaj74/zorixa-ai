import { CREDIT_PACKS, type CreditPack } from "@/lib/atlas-pricing-catalog";

export type DodoPackId = CreditPack["id"];

const PRODUCT_ENV_KEYS: Record<DodoPackId, string> = {
  starter: "DODO_PRODUCT_STARTER",
  pro: "DODO_PRODUCT_PRO",
  creator: "DODO_PRODUCT_CREATOR",
  ultra: "DODO_PRODUCT_ULTRA"
};

/** Default product IDs — must match Dodo live API exactly (case-sensitive). */
const DEFAULT_PRODUCT_IDS: Record<DodoPackId, string> = {
  starter: "pdt_0Ngft0RP4JoUHCPakR3JG",
  pro: "pdt_0NgfthB5ymLtXkYxWD8yR",
  creator: "pdt_0NgfwucO0G8Anm64IbfaS",
  ultra: "pdt_0NgfxOGpB9NlTRazoi4os"
};

export function dodoPaymentsEnvironment(): "test_mode" | "live_mode" {
  const raw = process.env.DODO_PAYMENTS_ENVIRONMENT?.trim().toLowerCase();
  if (raw === "live_mode" || raw === "live") return "live_mode";
  return "test_mode";
}

export function getDodoApiKey(): string | null {
  return process.env.DODO_PAYMENTS_API_KEY?.trim() || null;
}

export function getDodoWebhookKey(): string | null {
  return (
    process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim() ||
    process.env.DODO_WEBHOOK_SECRET?.trim() ||
    null
  );
}

export function getDodoReturnUrl(): string {
  const fromEnv =
    process.env.DODO_PAYMENTS_RETURN_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "") + "/billing/success";
  return "http://localhost:3000/billing/success";
}

export function getDodoProductId(packId: string): string | null {
  if (!(packId in PRODUCT_ENV_KEYS)) return null;
  const key = PRODUCT_ENV_KEYS[packId as DodoPackId];
  const fromEnv = process.env[key]?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_PRODUCT_IDS[packId as DodoPackId] ?? null;
}

export function creditsForDodoProductId(productId: string): number | null {
  const id = productId.trim();
  for (const pack of CREDIT_PACKS) {
    if (getDodoProductId(pack.id) === id) return pack.credits;
  }
  return null;
}

export function packForId(packId: string): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.id === packId) ?? null;
}

export function isDodoCheckoutConfigured(): boolean {
  return Boolean(getDodoApiKey() && getDodoProductId("starter"));
}
