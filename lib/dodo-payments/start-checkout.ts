import type { DodoPackId } from "@/lib/dodo-payments/config";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

export const CREDITS_BEFORE_CHECKOUT_KEY = "zorixa:credits_before_checkout";

async function snapshotCreditsBeforeCheckout(): Promise<void> {
  try {
    const res = await fetch("/api/credits", { credentials: "include", cache: "no-store" });
    if (!res.ok) return;
    const body = (await res.json()) as { credits_balance?: number };
    if (typeof body.credits_balance === "number") {
      sessionStorage.setItem(CREDITS_BEFORE_CHECKOUT_KEY, String(body.credits_balance));
    }
  } catch {
    /* non-blocking */
  }
}

export async function startDodoCheckout(
  packId: DodoPackId,
  billing: "monthly" | "yearly" | "one_time" = "monthly"
): Promise<void> {
  trackEvent(AnalyticsEvents.CHECKOUT_STARTED, { pack_id: packId, billing });
  await snapshotCreditsBeforeCheckout();

  const res = await fetch("/api/billing/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ packId, billing })
  });

  const data = (await res.json().catch(() => ({}))) as {
    checkout_url?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? `Checkout failed (${res.status})`);
  }

  if (!data.checkout_url) {
    throw new Error("Checkout URL missing from server");
  }

  window.location.href = data.checkout_url;
}
