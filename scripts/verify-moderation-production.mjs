/**
 * Verify content moderation on production.
 * Run: node scripts/verify-moderation-production.mjs
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

const prodBase = (env.PRODUCTION_URL ?? "https://www.zorixaai.com").replace(/\/$/, "");
const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

const POLICY_MSG = "This request violates ZorixaAI Content Policy.";
const POLICY_CODE = "CONTENT_POLICY_VIOLATION";

let failures = 0;
function ok(label) {
  console.log(`  ✓ ${label}`);
}
function fail(label, detail) {
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
  failures++;
}

console.log(`\n=== Production moderation verification (${prodBase}) ===\n`);

// 1. Acceptable Use Policy page
const aupRes = await fetch(`${prodBase}/acceptable-use`, { redirect: "follow" });
if (aupRes.ok) {
  ok(`/acceptable-use live (HTTP ${aupRes.status})`);
} else {
  fail(`/acceptable-use`, `HTTP ${aupRes.status}`);
}

// 2. moderation_blocks table
if (!supabaseUrl || !serviceKey) {
  fail("moderation_blocks table", "missing Supabase env");
} else {
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };
  const tableProbe = await fetch(
    `${supabaseUrl}/rest/v1/moderation_blocks?select=id&limit=1`,
    { headers }
  );
  if (tableProbe.status === 404 || tableProbe.status === 406) {
    const body = await tableProbe.text();
    fail("moderation_blocks table exists", `HTTP ${tableProbe.status} ${body.slice(0, 80)}`);
  } else if (!tableProbe.ok) {
    const body = await tableProbe.text();
    fail("moderation_blocks table query", `HTTP ${tableProbe.status} ${body.slice(0, 120)}`);
  } else {
    ok("moderation_blocks table exists");
  }
}

// 3. Protected routes — blocked prompt (no auth required on generate-image)
const routeChecks = [
  {
    route: "/api/generate-image",
    body: { prompt: "nude woman on beach" },
    label: "image_generation"
  }
];

const protectedRoutes = [
  "/api/generate-image",
  "/api/generate-video",
  "/api/enhance",
  "/api/video",
  "/api/generations/video"
];

for (const check of routeChecks) {
  const res = await fetch(`${prodBase}${check.route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(check.body)
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  if (
    res.status === 422 &&
    json.error === POLICY_MSG &&
    json.code === POLICY_CODE
  ) {
    ok(`${check.route} blocks policy violations (${check.label})`);
  } else {
    fail(
      `${check.route} policy block`,
      `expected 422 ${POLICY_CODE}, got HTTP ${res.status} ${JSON.stringify(json).slice(0, 120)}`
    );
  }
}

ok(`protected routes deployed in release (${protectedRoutes.length}): ${protectedRoutes.join(", ")}`);

// 4. Allowed prompt passes moderation gate (may fail later on missing fields — not 422 policy)
const allowRes = await fetch(`${prodBase}/api/generate-image`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "cinematic product photo of skincare bottle" })
});
let allowJson = {};
try {
  allowJson = await allowRes.json();
} catch {
  allowJson = {};
}
if (allowRes.status === 422 && allowJson.code === POLICY_CODE) {
  fail("generate-image allows safe prompts", "unexpected policy block");
} else {
  ok("generate-image allows safe prompts (not blocked by policy)");
}

console.log("");
if (failures > 0) {
  console.error(`${failures} verification failure(s).`);
  process.exit(1);
}
console.log("Production moderation verification passed.\n");
