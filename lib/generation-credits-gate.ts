import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

export type InsufficientCreditsState = {
  open: boolean;
  required: number;
  balance: number;
};

export const CLOSED_INSUFFICIENT_CREDITS: InsufficientCreditsState = {
  open: false,
  required: 0,
  balance: 0
};

/** Returns true when generation should be blocked and the modal should open. */
export function shouldBlockForInsufficientCredits(
  balance: number,
  required: number,
  surface: "image" | "video"
): boolean {
  if (required <= 0 || balance >= required) return false;
  trackEvent(AnalyticsEvents.INSUFFICIENT_CREDITS_MODAL_OPENED, {
    surface,
    required,
    balance
  });
  return true;
}
