/**
 * Verify P0 billing security fixes (RLS, RPC lockdown, atomic spend/refund).
 * Run after applying supabase/migrations/20260622120000_p0_security_billing.sql
 *
 *   node scripts/verify-p0-security.mjs
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

function loadEnv() {
  /** Later files must not wipe .env.local with empty Vercel placeholders. */
  const merged = {};
  for (const file of [".env.local", ".env.vercel.pull", ".env.vercel.production"]) {
    const parsed = parseEnvFile(path.join(root, file));
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== "") merged[key] = value;
    }
  }
  return { ...merged, ...process.env };
}

const env = loadEnv();

const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const anonKey = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const serviceHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json"
};

const anonHeaders = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
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

async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

console.log("\n=== P0 security verification ===\n");

// --- 1. Anon cannot call grant_purchase_credits ---
{
  const res = await fetch(`${url}/rest/v1/rpc/grant_purchase_credits`, {
    method: "POST",
    headers: anonHeaders,
    body: JSON.stringify({
      p_user_id: "00000000-0000-4000-8000-000000000001",
      p_credits: 1,
      p_order_ref: `p0-probe-grant:${Date.now()}`
    })
  });
  const body = await parseJsonSafe(res);
  if (res.ok) {
    fail("anon blocked from grant_purchase_credits", `HTTP ${res.status} ${JSON.stringify(body)}`);
  } else {
    ok("anon blocked from grant_purchase_credits");
  }
}

// --- 2. Anon cannot call spend_credits ---
{
  const res = await fetch(`${url}/rest/v1/rpc/spend_credits`, {
    method: "POST",
    headers: anonHeaders,
    body: JSON.stringify({
      p_user_id: "00000000-0000-4000-8000-000000000001",
      p_amount: 1,
      p_ref_key: `p0-probe-spend:${Date.now()}`,
      p_feature: "enhance"
    })
  });
  const body = await parseJsonSafe(res);
  if (res.ok) {
    fail("anon blocked from spend_credits", `HTTP ${res.status} ${JSON.stringify(body)}`);
  } else if (res.status === 404 || String(body).includes("PGRST202")) {
    fail("spend_credits RPC exists", "run P0 migration SQL first");
  } else {
    ok("anon blocked from spend_credits");
  }
}

// --- 3. Anon cannot PATCH credits_balance on profiles ---
{
  const profilesRes = await fetch(
    `${url}/rest/v1/users_profiles?select=id,credits_balance&limit=1`,
    { headers: serviceHeaders }
  );
  const profiles = await profilesRes.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (!profile?.id) {
    fail("profile row for RLS PATCH probe", "no users_profiles rows");
  } else {
    const beforeBalance = profile.credits_balance;
    const patchRes = await fetch(`${url}/rest/v1/users_profiles?id=eq.${profile.id}`, {
      method: "PATCH",
      headers: { ...anonHeaders, Prefer: "return=representation" },
      body: JSON.stringify({ credits_balance: 999999, is_premium: true })
    });
    const patchBody = await parseJsonSafe(patchRes);
    const afterRes = await fetch(
      `${url}/rest/v1/users_profiles?select=credits_balance,is_premium&id=eq.${profile.id}`,
      { headers: serviceHeaders }
    );
    const afterRows = await afterRes.json();
    const after = Array.isArray(afterRows) ? afterRows[0] : null;

    const balanceChanged = after?.credits_balance !== beforeBalance;
    const rowsReturned =
      Array.isArray(patchBody) && patchBody.length > 0 && patchBody[0]?.credits_balance === 999999;

    if (balanceChanged || rowsReturned) {
      fail(
        "anon blocked from PATCH credits_balance / is_premium",
        `balance before=${beforeBalance} after=${after?.credits_balance}`
      );
    } else {
      ok("anon blocked from PATCH credits_balance / is_premium");
    }
  }
}

// --- 4. spend_credits + refund_credits round-trip (service role) ---
{
  const profilesRes = await fetch(
    `${url}/rest/v1/users_profiles?select=id,credits_balance&limit=1`,
    { headers: serviceHeaders }
  );
  const profiles = await profilesRes.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (!profile?.id) {
    fail("spend/refund round-trip", "no profile");
  } else {
    const userId = profile.id;
    const beforeBalance = profile.credits_balance ?? 0;
    const refKey = `p0-spend-probe:${Date.now()}`;

    const spendRes = await fetch(`${url}/rest/v1/rpc/spend_credits`, {
      method: "POST",
      headers: serviceHeaders,
      body: JSON.stringify({
        p_user_id: userId,
        p_amount: 1,
        p_ref_key: refKey,
        p_feature: "enhance"
      })
    });
    const spendBody = await parseJsonSafe(spendRes);

    if (!spendRes.ok || spendBody?.ok !== true) {
      if (spendRes.status === 404 || String(spendBody).includes("PGRST202")) {
        fail("spend_credits RPC exists (service role)", "run P0 migration");
      } else if (spendBody?.error === "INSUFFICIENT_CREDITS") {
        ok("spend_credits RPC exists (skipped deduct — zero balance profile)");
      } else {
        fail("spend_credits deduct", JSON.stringify(spendBody));
      }
    } else {
      ok("spend_credits atomic deduct");

      const afterSpendRes = await fetch(
        `${url}/rest/v1/users_profiles?select=credits_balance&id=eq.${userId}`,
        { headers: serviceHeaders }
      );
      const afterSpendRows = await afterSpendRes.json();
      const afterSpendBalance = afterSpendRows?.[0]?.credits_balance;

      if (typeof afterSpendBalance === "number" && afterSpendBalance === beforeBalance - 1) {
        ok("spend_credits reduced balance by 1");
      } else {
        fail(
          "spend_credits balance delta",
          `before=${beforeBalance} after=${afterSpendBalance}`
        );
      }

      const refundRes = await fetch(`${url}/rest/v1/rpc/refund_credits`, {
        method: "POST",
        headers: serviceHeaders,
        body: JSON.stringify({
          p_user_id: userId,
          p_ref_key: refKey
        })
      });
      const refundBody = await parseJsonSafe(refundRes);

      if (!refundRes.ok || refundBody?.ok !== true) {
        fail("refund_credits after spend", JSON.stringify(refundBody));
      } else {
        ok("refund_credits restores spend");

        const afterRefundRes = await fetch(
          `${url}/rest/v1/users_profiles?select=credits_balance&id=eq.${userId}`,
          { headers: serviceHeaders }
        );
        const afterRefundRows = await afterRefundRes.json();
        const afterRefundBalance = afterRefundRows?.[0]?.credits_balance;

        if (afterRefundBalance === beforeBalance) {
          ok("refund_credits restored original balance");
        } else {
          fail(
            "refund_credits balance restored",
            `expected ${beforeBalance}, got ${afterRefundBalance}`
          );
        }
      }
    }
  }
}

// --- 5. finalize_credit_ref RPC exists ---
{
  const res = await fetch(`${url}/rest/v1/rpc/finalize_credit_ref`, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({
      p_user_id: "00000000-0000-4000-8000-000000000099",
      p_pending_ref: "atlas-pending:missing",
      p_final_ref: "atlas:missing"
    })
  });
  const body = await parseJsonSafe(res);
  if (res.status === 404 || String(body).includes("PGRST202")) {
    fail("finalize_credit_ref RPC exists", "run P0 migration");
  } else {
    ok("finalize_credit_ref RPC exists");
  }
}

console.log("\n---");
if (failures === 0) {
  console.log("P0 security verification passed.\n");
  process.exit(0);
}
console.error(`${failures} check(s) failed.\n`);
process.exit(1);
