import type { AnalyticsEventName } from "@/lib/analytics-events";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
type PostHogClient = typeof import("posthog-js").default;

declare global {
  interface Window {
    posthog?: PostHogClient;
    gtag?: (...args: unknown[]) => void;
  }
}

let posthogInitAttempted = false;
let posthogClient: PostHogClient | null = null;
let posthogLoadPromise: Promise<PostHogClient | null> | null = null;
let posthogReadyPromise: Promise<PostHogClient | null> | null = null;

function posthogFeatureEnabled(flag: string | undefined): boolean {
  return flag?.trim().toLowerCase() === "true";
}

async function loadPostHogClient(): Promise<PostHogClient | null> {
  if (typeof window === "undefined") return null;
  if (posthogClient) return posthogClient;

  if (!posthogLoadPromise) {
    posthogLoadPromise = import("posthog-js")
      .then((mod) => {
        posthogClient = mod.default;
        return posthogClient;
      })
      .catch(() => null);
  }

  return posthogLoadPromise;
}

function ensurePostHogReady(): Promise<PostHogClient | null> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key || typeof window === "undefined") return Promise.resolve(null);

  if (!posthogReadyPromise) {
    posthogReadyPromise = loadPostHogClient().then((posthog) => {
      if (!posthog) return null;
      if (!posthogInitAttempted) {
        posthogInitAttempted = true;
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
          person_profiles: "identified_only",
          capture_pageview: true,
          capture_pageleave: true,
          persistence: "localStorage",
          disable_session_recording: !posthogFeatureEnabled(process.env.NEXT_PUBLIC_POSTHOG_SESSION_RECORDING),
          disable_surveys: !posthogFeatureEnabled(process.env.NEXT_PUBLIC_POSTHOG_SURVEYS),
          capture_dead_clicks: posthogFeatureEnabled(process.env.NEXT_PUBLIC_POSTHOG_DEAD_CLICKS)
        });
        window.posthog = posthog;
      }
      return posthog;
    });
  }

  return posthogReadyPromise;
}

/** Initialize PostHog once (client). Safe to call from AnalyticsProvider. */
export function initPostHog(): void {
  void ensurePostHogReady();
}

/** Associate events with a signed-in Supabase user id. */
export function identifyAnalyticsUser(userId: string, traits?: AnalyticsProperties): void {
  if (typeof window === "undefined" || !userId.trim()) return;

  void ensurePostHogReady().then((posthog) => {
    if (!posthog) return;
    try {
      posthog.identify(userId, traits);
    } catch {
      /* ignore */
    }
  });
}

/** Fire a product analytics event (PostHog and/or GA when configured). */
export function trackEvent(name: AnalyticsEventName | string, properties?: AnalyticsProperties): void {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (key) {
    void ensurePostHogReady().then((posthog) => {
      if (!posthog) return;
      try {
        posthog.capture(name, properties);
      } catch {
        /* ignore */
      }
    });
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
