#!/usr/bin/env node
/**
 * Verify PostHog receives Zorixa onboarding events.
 *
 * Usage:
 *   NEXT_PUBLIC_POSTHOG_KEY=phc_... node scripts/posthog-verify-events.mjs
 *
 * Then open PostHog → Activity → Live events.
 */

const apiKey =
  process.env.POSTHOG_API_KEY?.trim() ||
  process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");

const TEST_EVENTS = [
  "signup_completed",
  "dashboard_viewed",
  "video_studio_viewed",
  "image_studio_viewed",
  "pricing_viewed",
  "checkout_started",
  "payment_completed",
  "credits_granted",
  "is_premium_updated",
  "first_generation_completed"
];

async function capture(event, distinctId) {
  const res = await fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      event,
      distinct_id: distinctId,
      properties: { source: "posthog-verify-script", test: true }
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${event}: HTTP ${res.status} ${text}`);
  }
}

async function main() {
  if (!apiKey) {
    console.error("Missing POSTHOG_API_KEY or NEXT_PUBLIC_POSTHOG_KEY");
    process.exit(1);
  }

  const distinctId = `verify-${Date.now()}`;
  console.log(`Sending ${TEST_EVENTS.length} test events to ${host} as ${distinctId}...`);

  for (const event of TEST_EVENTS) {
    await capture(event, distinctId);
    console.log(`  ✓ ${event}`);
  }

  console.log("\nDone. Check PostHog → Activity (filter distinct_id:", distinctId + ")");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
