import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

const FIRST_GEN_DONE_KEY = "zorixa_first_generation_completed";

export function trackFirstGenerationStarted(surface: "image" | "video"): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(FIRST_GEN_DONE_KEY)) return;
  trackEvent(AnalyticsEvents.FIRST_GENERATION_STARTED, { surface });
}

export function trackFirstGenerationCompleted(surface: "image" | "video"): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(FIRST_GEN_DONE_KEY)) return;
  localStorage.setItem(FIRST_GEN_DONE_KEY, "1");
  trackEvent(AnalyticsEvents.FIRST_GENERATION_COMPLETED, { surface });
}
