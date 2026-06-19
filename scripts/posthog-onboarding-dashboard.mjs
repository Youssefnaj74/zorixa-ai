#!/usr/bin/env node
/**
 * Create PostHog onboarding funnel + dashboard for ZorixaAI.
 *
 * Requires PostHog personal API key (Project settings → Personal API keys):
 *   POSTHOG_PERSONAL_API_KEY=phx_...
 *   POSTHOG_PROJECT_ID=12345
 *   POSTHOG_API_HOST=https://us.posthog.com  (optional, EU: https://eu.posthog.com)
 *
 * Usage: node scripts/posthog-onboarding-dashboard.mjs
 */

const personalKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
const apiHost = (process.env.POSTHOG_API_HOST || "https://us.posthog.com").replace(/\/$/, "");

const FUNNEL_EVENTS = [
  "signup_completed",
  "pricing_viewed",
  "checkout_started",
  "payment_completed",
  "first_generation_completed"
];

const DASHBOARD_TILES = [
  { name: "Signups", event: "signup_completed" },
  { name: "Pricing views", event: "pricing_viewed" },
  { name: "Checkout starts", event: "checkout_started" },
  { name: "Payments", event: "payment_completed" },
  { name: "First generations", event: "first_generation_completed" }
];

async function phFetch(path, body) {
  const res = await fetch(`${apiHost}/api/projects/${projectId}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${personalKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`PostHog API ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

function trendInsight(name, event) {
  return {
    name,
    filters: {
      insight: "TRENDS",
      events: [{ id: event, type: "events", order: 0 }],
      display: "ActionsLineGraph",
      date_from: "-30d"
    }
  };
}

function funnelInsight() {
  return {
    name: "Onboarding funnel",
    filters: {
      insight: "FUNNELS",
      funnel_viz_type: "steps",
      date_from: "-30d",
      events: FUNNEL_EVENTS.map((event, index) => ({
        id: event,
        type: "events",
        order: index
      }))
    }
  };
}

async function main() {
  if (!personalKey || !projectId) {
    console.error("Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID");
    console.error("\nManual setup in PostHog UI:");
    console.error("  Funnel steps:", FUNNEL_EVENTS.join(" → "));
    console.error("  Dashboard tiles:", DASHBOARD_TILES.map((t) => t.event).join(", "));
    process.exit(1);
  }

  console.log("Creating onboarding funnel insight...");
  const funnel = await phFetch("/insights/", funnelInsight());
  console.log(`  ✓ Funnel insight id ${funnel.id}`);

  const tileIds = [];
  for (const tile of DASHBOARD_TILES) {
    console.log(`Creating trend: ${tile.name} (${tile.event})...`);
    const insight = await phFetch("/insights/", trendInsight(tile.name, tile.event));
    tileIds.push(insight.id);
    console.log(`  ✓ Insight id ${insight.id}`);
  }

  console.log("Creating dashboard: Zorixa Onboarding...");
  const dashboard = await phFetch("/dashboards/", {
    name: "Zorixa Onboarding",
    description: "Signup → pricing → checkout → payment → first generation",
    tiles: [
      { insight: funnel.id, col: 0, row: 0, width: 6, height: 4 },
      ...tileIds.map((id, i) => ({
        insight: id,
        col: (i % 2) * 3,
        row: 4 + Math.floor(i / 2) * 3,
        width: 3,
        height: 3
      }))
    ]
  });

  console.log(`\nDashboard created: ${apiHost}/project/${projectId}/dashboard/${dashboard.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
