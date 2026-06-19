type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    posthog?: { capture: (event: string, properties?: AnalyticsProperties) => void };
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fire a product analytics event (PostHog and/or GA when configured). */
export function trackEvent(name: string, properties?: AnalyticsProperties): void {
  if (typeof window === "undefined") return;

  try {
    window.posthog?.capture?.(name, properties);
  } catch {
    /* ignore */
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
