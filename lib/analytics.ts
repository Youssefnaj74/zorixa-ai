import posthog from "posthog-js";

import type { AnalyticsEventName } from "@/lib/analytics-events";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    posthog?: typeof posthog;
    gtag?: (...args: unknown[]) => void;
  }
}

let posthogInitAttempted = false;

/** Initialize PostHog once (client). Safe to call from AnalyticsProvider. */
export function initPostHog(): void {
  if (typeof window === "undefined" || posthogInitAttempted) return;
  posthogInitAttempted = true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage"
  });
  window.posthog = posthog;
}

/** Associate events with a signed-in Supabase user id. */
export function identifyAnalyticsUser(userId: string, traits?: AnalyticsProperties): void {
  if (typeof window === "undefined" || !userId.trim()) return;
  try {
    initPostHog();
    posthog.identify(userId, traits);
  } catch {
    /* ignore */
  }
}

/** Fire a product analytics event (PostHog and/or GA when configured). */
export function trackEvent(name: AnalyticsEventName | string, properties?: AnalyticsProperties): void {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (key) {
    try {
      initPostHog();
      posthog.capture(name, properties);
    } catch {
      /* ignore */
    }
  }

  try {
    window.gtag?.("event", name, properties);
  } catch {
    /* ignore */
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", name, properties ?? {});
  }
}
