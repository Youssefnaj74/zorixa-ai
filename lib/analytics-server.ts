import { AnalyticsEvents, type AnalyticsEventName } from "@/lib/analytics-events";

type ServerEventProperties = Record<string, string | number | boolean | null | undefined>;

function posthogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
}

function posthogProjectKey(): string | null {
  return (
    process.env.POSTHOG_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ||
    null
  );
}

/** Server-side PostHog capture (Dodo webhooks, credit grants). Fire-and-forget. */
export async function captureServerEvent(
  distinctId: string,
  event: AnalyticsEventName | string,
  properties?: ServerEventProperties
): Promise<void> {
  const apiKey = posthogProjectKey();
  if (!apiKey || !distinctId.trim()) return;

  try {
    const res = await fetch(`${posthogHost()}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: {
          ...properties,
          $lib: "zorixa-server"
        }
      })
    });
    if (!res.ok) {
      console.warn("[analytics-server] capture failed", { event, status: res.status });
    }
  } catch (err) {
    console.warn("[analytics-server] capture error", { event, err });
  }
}

export async function trackPaymentGrantAnalytics(input: {
  userId: string;
  credits: number;
  orderRef: string;
  isPremiumUpdated: boolean;
}): Promise<void> {
  const base = {
    credits: input.credits,
    order_ref: input.orderRef,
    user_id: input.userId
  };

  await captureServerEvent(input.userId, AnalyticsEvents.PAYMENT_COMPLETED, {
    ...base,
    source: "dodo_webhook"
  });
  await captureServerEvent(input.userId, AnalyticsEvents.CREDITS_GRANTED, base);
  if (input.isPremiumUpdated) {
    await captureServerEvent(input.userId, AnalyticsEvents.IS_PREMIUM_UPDATED, {
      user_id: input.userId,
      order_ref: input.orderRef
    });
  }
}
