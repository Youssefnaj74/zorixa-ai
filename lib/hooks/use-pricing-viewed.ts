"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";

/** Track pricing page view once per mount. */
export function usePricingViewed(source: string): void {
  useEffect(() => {
    trackEvent("pricing_viewed", { source });
  }, [source]);
}
