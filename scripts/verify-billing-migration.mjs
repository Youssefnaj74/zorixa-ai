/**
 * Verify billing hardening migration (unique index + grant_purchase_credits RPC).
 * Run: node scripts/verify-billing-migration.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = {
  ...parseEnvFile(path.join(root, ".env.local")),
  ...parseEnvFile(path.join(root, ".env.vercel.pull")),
  ...process.env
};

const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const key = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json"
};

let failures = 0;
function ok(label) {
  console.log(`  ✓ ${label}`);
}
function fail(label, detail) {
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
  failures++;
}

console.log("\n=== Billing migration verification ===\n");

// 1. RPC exists — duplicate probe should return "duplicate", not PGRST202
const probeRef = `dodo:migration-probe:${Date.now()}`;
const probeUser = "00000000-0000-4000-8000-000000000099";

const first = await fetch(`${url}/rest/v1/rpc/grant_purchase_credits`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    p_user_id: probeUser,
    p_credits: 1,
    p_order_ref: probeRef
  })
});
const firstBody = await first.text();

if (first.status === 404 || firstBody.includes("PGRST202")) {
  fail("grant_purchase_credits RPC exists", "function not found — run migration SQL");
} else if (!first.ok && !firstBody.includes("no_profile")) {
  fail("grant_purchase_credits RPC callable", `HTTP ${first.status} ${firstBody.slice(0, 120)}`);
} else {
  ok("grant_purchase_credits RPC exists");
}

const parsedFirst = (() => {
  try {
    return JSON.parse(firstBody);
  } catch {
    return firstBody.replaceAll('"', "");
  }
})();

if (parsedFirst === "no_profile") {
  ok("grant_purchase_credits returns no_profile for missing user (expected)");
} else if (parsedFirst === "granted") {
  ok("grant_purchase_credits granted probe transaction");
  const second = await fetch(`${url}/rest/v1/rpc/grant_purchase_credits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_user_id: probeUser,
      p_credits: 1,
      p_order_ref: probeRef
    })
  });
  const secondBody = await second.text();
  const parsedSecond = (() => {
    try {
      return JSON.parse(secondBody);
    } catch {
      return secondBody.replaceAll('"', "");
    }
  })();
  if (parsedSecond === "duplicate") {
    ok("grant_purchase_credits dedup returns duplicate on retry");
  } else {
    fail("grant_purchase_credits dedup", `expected duplicate, got ${secondBody}`);
  }
}

// 2. Unique index — duplicate insert should fail with 23505
const dupRef = `dodo:unique-probe:${Date.now()}`;
const dupInsert = await fetch(`${url}/rest/v1/transactions`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=minimal" },
  body: JSON.stringify({
    user_id: "53517457-72be-4477-bbe1-531b642fc0b4",
    type: "purchase",
    credits_amount: 0,
    lemonsqueezy_order_id: dupRef,
    feature_used: null
  })
});

if (!dupInsert.ok) {
  fail("unique index probe insert #1", `HTTP ${dupInsert.status}`);
} else {
  const dupInsert2 = await fetch(`${url}/rest/v1/transactions`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: "53517457-72be-4477-bbe1-531b642fc0b4",
      type: "purchase",
      credits_amount: 0,
      lemonsqueezy_order_id: dupRef,
      feature_used: null
    })
  });
  if (dupInsert2.status === 409 || (await dupInsert2.text()).includes("23505")) {
    ok("UNIQUE index on transactions.lemonsqueezy_order_id blocks duplicates");
  } else {
    fail("UNIQUE index on lemonsqueezy_order_id", `second insert HTTP ${dupInsert2.status}`);
  }
}

console.log("\n---");
if (failures === 0) {
  console.log("Billing migration verification passed.\n");
  process.exit(0);
}
console.error(`${failures} check(s) failed.\n`);
process.exit(1);
