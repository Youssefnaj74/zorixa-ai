import type { DodoPackId } from "@/lib/dodo-payments/config";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

export async function startDodoCheckout(
  packId: DodoPackId,
  billing: "monthly" | "yearly" = "monthly"
): Promise<void> {
  trackEvent(AnalyticsEvents.CHECKOUT_STARTED, { pack_id: packId, billing });

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
