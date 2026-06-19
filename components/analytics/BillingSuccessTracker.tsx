"use client";

import { useEffect, useRef } from "react";

import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

/** Fires payment_completed once when user lands on /billing/success. */
export function BillingSuccessTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(AnalyticsEvents.PAYMENT_COMPLETED, { source: "billing_success_page" });
  }, []);

  return null;
}
