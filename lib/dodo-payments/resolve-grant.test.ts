import { describe, expect, it } from "vitest";

import {
  resolveGrantFromPaymentData,
  resolveGrantFromSubscriptionActiveData,
  resolveGrantFromSubscriptionRenewedData
} from "@/lib/dodo-payments/resolve-grant";

describe("resolveGrantFromPaymentData", () => {
  it("skips subscription-linked payment events", () => {
    const result = resolveGrantFromPaymentData({
      payment_id: "pay_1",
      subscription_id: "sub_1",
      metadata: { user_id: "user-1", credits: "1000" }
    });
    expect(result).toEqual({
      status: "skip",
      reason: "subscription_payment_handled_by_subscription_events"
    });
  });

  it("errors when user_id is missing on a one-time payment", () => {
    const result = resolveGrantFromPaymentData({
      payment_id: "pay_1",
      metadata: { credits: "1000" }
    });
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.reason).toBe("missing_user_id");
    }
  });

  it("grants from metadata credits when product is unknown", () => {
    const result = resolveGrantFromPaymentData({
      payment_id: "pay_1",
      metadata: { user_id: "user-1", credits: "500" }
    });
    expect(result).toEqual({
      status: "grant",
      grant: { userId: "user-1", credits: 500, orderRef: "dodo:payment:pay_1" }
    });
  });
});

describe("resolveGrantFromSubscriptionRenewedData", () => {
  it("skips the initial period handled by subscription.active", () => {
    const result = resolveGrantFromSubscriptionRenewedData({
      subscription_id: "sub_1",
      created_at: "2026-01-01T00:00:00Z",
      previous_billing_date: "2026-01-01T00:00:00Z",
      metadata: { user_id: "user-1", credits: "1000" }
    });
    expect(result).toEqual({
      status: "skip",
      reason: "initial_period_handled_by_subscription_active"
    });
  });
});

describe("resolveGrantFromSubscriptionActiveData", () => {
  it("errors without subscription_id", () => {
    const result = resolveGrantFromSubscriptionActiveData({
      metadata: { user_id: "user-1", credits: "1000" }
    });
    expect(result.status).toBe("error");
  });
});
