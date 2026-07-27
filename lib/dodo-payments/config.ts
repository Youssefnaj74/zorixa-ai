import {
  CREDIT_PACKS,
  STARTER_PASS,
  type CreditPack,
  type StarterPassOffer
} from "@/lib/atlas-pricing-catalog";

export type DodoMonthlyPackId = CreditPack["id"];
export type DodoPackId = DodoMonthlyPackId | StarterPassOffer["id"];

const MONTHLY_PRODUCT_ENV_KEYS: Record<DodoMonthlyPackId, string> = {
  starter: "DODO_PRODUCT_STARTER",
  pro: "DODO_PRODUCT_PRO",
  creator: "DODO_PRODUCT_CREATOR",
  ultra: "DODO_PRODUCT_ULTRA"
};

/** Default product IDs — must match Dodo live API exactly (case-sensitive). */
const DEFAULT_MONTHLY_PRODUCT_IDS: Record<DodoMonthlyPackId, string> = {
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
  if (fromEnv) {
    const base = fromEnv.replace(/\/$/, "");
    if (base.endsWith("/billing/success")) return base;
    return `${base}/billing/success`;
  }
  return "http://localhost:3000/billing/success";
}

export function isStarterPassId(packId: string): packId is StarterPassOffer["id"] {
  return packId === STARTER_PASS.id;
}

export function isDodoPackId(packId: string): packId is DodoPackId {
  return isStarterPassId(packId) || packId in MONTHLY_PRODUCT_ENV_KEYS;
}

export function getDodoProductId(packId: string): string | null {
  if (isStarterPassId(packId)) {
    return process.env.DODO_PRODUCT_STARTER_PASS?.trim() || null;
  }
  if (!(packId in MONTHLY_PRODUCT_ENV_KEYS)) return null;
  const key = MONTHLY_PRODUCT_ENV_KEYS[packId as DodoMonthlyPackId];
  const fromEnv = process.env[key]?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_MONTHLY_PRODUCT_IDS[packId as DodoMonthlyPackId] ?? null;
}

export function creditsForDodoProductId(productId: string): number | null {
  const id = productId.trim();
  const starterPassProduct = getDodoProductId(STARTER_PASS.id);
  if (starterPassProduct && starterPassProduct === id) return STARTER_PASS.credits;

  for (const pack of CREDIT_PACKS) {
    if (getDodoProductId(pack.id) === id) return pack.credits;
  }
  return null;
}

export function packIdForDodoProductId(productId: string): DodoPackId | null {
  const id = productId.trim();
  const starterPassProduct = getDodoProductId(STARTER_PASS.id);
  if (starterPassProduct && starterPassProduct === id) return STARTER_PASS.id;

  for (const pack of CREDIT_PACKS) {
    if (getDodoProductId(pack.id) === id) return pack.id as DodoMonthlyPackId;
  }
  return null;
}

export type CheckoutOffer = {
  id: DodoPackId;
  credits: number;
  name: string;
  billing: "monthly" | "one_time";
};

export function offerForId(packId: string): CheckoutOffer | null {
  if (isStarterPassId(packId)) {
    return {
      id: STARTER_PASS.id,
      credits: STARTER_PASS.credits,
      name: STARTER_PASS.name,
      billing: "one_time"
    };
  }
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) return null;
  return {
    id: pack.id as DodoMonthlyPackId,
    credits: pack.credits,
    name: pack.name,
    billing: "monthly"
  };
}

/** @deprecated Use offerForId — kept for monthly pack callers. */
export function packForId(packId: string): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.id === packId) ?? null;
}

export function isDodoCheckoutConfigured(): boolean {
  return Boolean(getDodoApiKey() && getDodoProductId("starter"));
}

export function isStarterPassConfigured(): boolean {
  return Boolean(getDodoApiKey() && getDodoProductId(STARTER_PASS.id));
}
