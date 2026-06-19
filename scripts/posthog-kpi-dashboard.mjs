#!/usr/bin/env node
/**
 * Create PostHog KPI trend insights + dashboard for studio page views and conversions.
 *
 *   POSTHOG_PERSONAL_API_KEY=phx_...
 *   POSTHOG_PROJECT_ID=477496
 *   POSTHOG_API_HOST=https://us.posthog.com
 *
 * Usage: npm run posthog:kpi-dashboard
 */

const personalKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
const apiHost = (process.env.POSTHOG_API_HOST || "https://us.posthog.com").replace(/\/$/, "");

const KPI_TILES = [
  { name: "Dashboard Views", event: "dashboard_viewed" },
  { name: "Video Studio Views", event: "video_studio_viewed" },
  { name: "Image Studio Views", event: "image_studio_viewed" },
  { name: "Pricing Views", event: "pricing_viewed" },
  { name: "Checkout Starts", event: "checkout_started" },
  { name: "Payments", event: "payment_completed" }
];

const STUDIO_FUNNEL_EVENTS = [
  "dashboard_viewed",
  "video_studio_viewed",
  "pricing_viewed",
  "checkout_started",
  "payment_completed"
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
      events: [{ id: event, type: "events", order: 0, math: "total" }],
      display: "ActionsLineGraph",
      date_from: "-30d"
    }
  };
}

function studioFunnelInsight() {
  return {
    name: "Studio → payment funnel",
    filters: {
      insight: "FUNNELS",
      funnel_viz_type: "steps",
      date_from: "-30d",
      events: STUDIO_FUNNEL_EVENTS.map((event, index) => ({
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
    console.error("\nManual KPI trends in PostHog → Product analytics → Trends:");
    for (const tile of KPI_TILES) {
      console.error(`  - ${tile.name}: event "${tile.event}"`);
    }
    process.exit(1);
  }

  console.log("Creating studio → payment funnel...");
  const funnel = await phFetch("/insights/", studioFunnelInsight());
  console.log(`  ✓ Funnel insight id ${funnel.id}`);

  const tileIds = [];
  for (const tile of KPI_TILES) {
    console.log(`Creating trend: ${tile.name} (${tile.event})...`);
    const insight = await phFetch("/insights/", trendInsight(tile.name, tile.event));
    tileIds.push(insight.id);
    console.log(`  ✓ Insight id ${insight.id}`);
  }

  console.log('Creating dashboard: "Zorixa KPIs"...');
  const dashboard = await phFetch("/dashboards/", {
    name: "Zorixa KPIs",
    description: "Studio page views, pricing, checkout, and payments (last 30 days)",
    tiles: [
      { insight: funnel.id, col: 0, row: 0, width: 6, height: 4 },
      ...tileIds.map((id, i) => ({
        insight: id,
        col: (i % 3) * 2,
        row: 4 + Math.floor(i / 3) * 3,
        width: 2,
        height: 3
      }))
    ]
  });

  console.log(`\nDashboard: ${apiHost}/project/${projectId}/dashboard/${dashboard.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
