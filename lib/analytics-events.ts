/** Canonical PostHog / GA event names for the onboarding funnel. */
export const AnalyticsEvents = {
  SIGNUP_COMPLETED: "signup_completed",
  DASHBOARD_VIEWED: "dashboard_viewed",
  VIDEO_STUDIO_VIEWED: "video_studio_viewed",
  IMAGE_STUDIO_VIEWED: "image_studio_viewed",
  PRICING_VIEWED: "pricing_viewed",
  CHECKOUT_STARTED: "checkout_started",
  PAYMENT_COMPLETED: "payment_completed",
  CREDITS_GRANTED: "credits_granted",
  IS_PREMIUM_UPDATED: "is_premium_updated",
  ONBOARDING_CARD_CLICKED: "onboarding_card_clicked",
  INSUFFICIENT_CREDITS_MODAL_OPENED: "insufficient_credits_modal_opened",
  FIRST_GENERATION_STARTED: "first_generation_started",
  FIRST_GENERATION_COMPLETED: "first_generation_completed"
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
