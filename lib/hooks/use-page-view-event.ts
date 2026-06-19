"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";
import type { AnalyticsEventName } from "@/lib/analytics-events";

type PageViewProperties = Record<string, string | number | boolean | null | undefined>;

/** Fire a page-view analytics event once when the host page mounts. */
export function usePageViewEvent(
  event: AnalyticsEventName,
  properties?: PageViewProperties
): void {
  useEffect(() => {
    trackEvent(event, properties);
    // Intentionally once per mount — event name is stable per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}
