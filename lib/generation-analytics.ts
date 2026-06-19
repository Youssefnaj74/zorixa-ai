import { trackEvent } from "@/lib/analytics";

const FIRST_GEN_DONE_KEY = "zorixa_first_generation_completed";

export function trackFirstGenerationStarted(surface: "image" | "video"): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(FIRST_GEN_DONE_KEY)) return;
  trackEvent("first_generation_started", { surface });
}

export function trackFirstGenerationCompleted(surface: "image" | "video"): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(FIRST_GEN_DONE_KEY)) return;
  localStorage.setItem(FIRST_GEN_DONE_KEY, "1");
  trackEvent("first_generation_completed", { surface });
}
