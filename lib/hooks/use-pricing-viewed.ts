"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

/** Track pricing page view once per mount. */
export function usePricingViewed(source: string): void {
  useEffect(() => {
    trackEvent(AnalyticsEvents.PRICING_VIEWED, { source });
  }, [source]);
}
