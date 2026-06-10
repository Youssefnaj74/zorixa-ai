import DodoPayments from "dodopayments";
import type { SubscriptionListResponse, SubscriptionStatus } from "dodopayments/resources/subscriptions";

import { CREDIT_PACKS } from "@/lib/atlas-pricing-catalog";

import {
  creditsForDodoProductId,
  dodoPaymentsEnvironment,
  getDodoApiKey,
  getDodoProductId
} from "./config";
import { resolveDodoCustomerIdByEmail } from "./resolve-dodo-customer";

export type BillingSummary = {
  hasSubscription: boolean;
  planName: string | null;
  status: string | null;
  statusRaw: SubscriptionStatus | null;
  nextRenewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  creditsPerMonth: number | null;
};

const STATUS_PRIORITY: Record<SubscriptionStatus, number> = {
  active: 0,
  on_hold: 1,
  pending: 2,
  cancelled: 3,
  failed: 4,
  expired: 5
};

function formatStatusLabel(
  status: SubscriptionStatus,
  cancelAtPeriodEnd: boolean
): string {
  if (cancelAtPeriodEnd && status === "active") {
    return "Cancels at period end";
  }
  switch (status) {
    case "active":
      return "Active";
    case "on_hold":
      return "On hold";
    case "pending":
      return "Pending";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return "Failed";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

function planNameForProduct(productId: string, productName?: string | null): string {
  if (productName?.trim()) return productName.trim();
  for (const pack of CREDIT_PACKS) {
    if (getDodoProductId(pack.id) === productId) return pack.name;
  }
  return "Zorixa plan";
}

function pickPrimarySubscription(
  items: SubscriptionListResponse[]
): SubscriptionListResponse | null {
  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 99;
    const pb = STATUS_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return sorted[0] ?? null;
}

export function emptyBillingSummary(): BillingSummary {
  return {
    hasSubscription: false,
    planName: null,
    status: null,
    statusRaw: null,
    nextRenewalDate: null,
    cancelAtPeriodEnd: false,
    creditsPerMonth: null
  };
}

export async function fetchBillingSummaryForEmail(
  email: string
): Promise<{ summary: BillingSummary } | { error: string }> {
  const apiKey = getDodoApiKey();
  if (!apiKey) {
    return { error: "Payments are not configured." };
  }

  const resolved = await resolveDodoCustomerIdByEmail(email);
  if ("error" in resolved) {
    return { summary: emptyBillingSummary() };
  }

  const client = new DodoPayments({
    bearerToken: apiKey,
    environment: dodoPaymentsEnvironment()
  });

  const page = await client.subscriptions.list({
    customer_id: resolved.customerId,
    page_size: 20
  });

  const subscription = pickPrimarySubscription(page.items);
  if (!subscription) {
    return { summary: emptyBillingSummary() };
  }

  const creditsPerMonth = creditsForDodoProductId(subscription.product_id);

  return {
    summary: {
      hasSubscription: true,
      planName: planNameForProduct(subscription.product_id, subscription.product_name),
      status: formatStatusLabel(subscription.status, subscription.cancel_at_next_billing_date),
      statusRaw: subscription.status,
      nextRenewalDate: subscription.next_billing_date ?? null,
      cancelAtPeriodEnd: subscription.cancel_at_next_billing_date,
      creditsPerMonth: creditsPerMonth
    }
  };
}
