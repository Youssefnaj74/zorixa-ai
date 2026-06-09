/**
 * Debug Dodo 422 "Product does not exist" — prints base URL, env, product lookup, raw API bodies.
 * Run: node scripts/debug-dodo-422.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import DodoPayments from "dodopayments";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PRODUCT_IDS = {
  starter: "pdt_0Ngft0RP4JoUHCPakR3JG",
  pro: "pdt_0NgfthB5ymLtXkYxWD8yR",
  creator: "pdt_0NgfwucO0G8Anm64IbfaS",
  ultra: "pdt_0NgfxOGpB9NlTRazoi4os"
};

const BASE_URLS = {
  live_mode: "https://live.dodopayments.com",
  test_mode: "https://test.dodopayments.com"
};

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function maskKey(key) {
  if (!key || key.length < 12) return "(missing or too short)";
  return `${key.slice(0, 8)}…${key.slice(-4)} (len ${key.length})`;
}

function printApiError(label, err) {
  console.log(`\n--- ${label} ---`);
  console.log("message:", err?.message ?? String(err));
  if (err?.status != null) console.log("status:", err.status);
  if (err?.error != null) {
    console.log("error body (parsed):");
    console.log(JSON.stringify(err.error, null, 2));
  }
  if (err?.headers) {
    const reqId =
      err.headers.get?.("x-request-id") ??
      err.headers.get?.("request-id") ??
      err.headers["x-request-id"];
    if (reqId) console.log("x-request-id:", reqId);
  }
}

async function rawFetch(baseUrl, apiKey, method, apiPath, body) {
  const url = `${baseUrl}${apiPath}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text };
  }
  return { url, status: res.status, statusText: res.statusText, headers: Object.fromEntries(res.headers), body: json, raw: text };
}

const env = { ...parseEnvFile(path.join(root, ".env.local")), ...process.env };
const apiKey = (env.DODO_PAYMENTS_API_KEY ?? "").trim();
const configuredEnv = (env.DODO_PAYMENTS_ENVIRONMENT ?? "(unset)").trim();
const appResolvedEnv =
  configuredEnv.toLowerCase() === "live_mode" || configuredEnv.toLowerCase() === "live"
    ? "live_mode"
    : "test_mode";

console.log("=== Dodo 422 debug ===\n");
console.log("DODO_PAYMENTS_ENVIRONMENT (raw):", configuredEnv);
console.log("App resolves to (lib/dodo-payments/config.ts):", appResolvedEnv);
console.log("DODO_PAYMENTS_API_KEY:", maskKey(apiKey));
console.log("DODO_PAYMENTS_BASE_URL env:", env.DODO_PAYMENTS_BASE_URL ?? "(unset)");
console.log("\nSDK base URLs:");
console.log("  live_mode →", BASE_URLS.live_mode);
console.log("  test_mode →", BASE_URLS.test_mode);

if (!apiKey) {
  console.error("\nNo DODO_PAYMENTS_API_KEY in .env.local");
  process.exit(1);
}

const starterId = env.DODO_PRODUCT_STARTER?.trim() || PRODUCT_IDS.starter;
console.log("\nStarter product_id sent to API:", starterId);

for (const environment of ["live_mode", "test_mode"]) {
  const baseUrl = BASE_URLS[environment];
  console.log(`\n${"=".repeat(60)}`);
  console.log(`ENVIRONMENT: ${environment}`);
  console.log(`BASE URL: ${baseUrl}`);
  console.log("=".repeat(60));

  const client = new DodoPayments({ bearerToken: apiKey, environment });

  // 1) List products (first page)
  try {
    const list = await client.products.list({ page_size: 20 });
    const items = list?.items ?? list?.data ?? [];
    console.log(`\nproducts.list → OK (${items.length} on page)`);
    for (const p of items.slice(0, 8)) {
      console.log(
        `  • ${p.product_id ?? p.id} | ${p.name ?? "?"} | archived=${p.is_archived ?? p.archived ?? "?"} | recurring=${p.is_recurring ?? "?"}`
      );
    }
    if (items.length === 0) console.log("  (empty — API key may be wrong workspace or wrong mode)");
  } catch (err) {
    printApiError("products.list FAILED", err);
  }

  // 2) Retrieve starter product by ID
  try {
    const product = await client.products.retrieve(starterId);
    console.log(`\nproducts.retrieve(${starterId}) → OK`);
    console.log(JSON.stringify(product, null, 2));
  } catch (err) {
    printApiError(`products.retrieve(${starterId}) FAILED`, err);
  }

  // 3) Raw GET /products/{id}
  const getProduct = await rawFetch(baseUrl, apiKey, "GET", `/products/${starterId}`);
  console.log(`\nRAW GET ${getProduct.url}`);
  console.log("status:", getProduct.status, getProduct.statusText);
  console.log("body:", JSON.stringify(getProduct.body, null, 2));

  // 4) Checkout session (same payload as app)
  const checkoutPayload = {
    product_cart: [{ product_id: starterId, quantity: 1 }],
    customer: { email: "debug@zorixaai.com", name: "Debug" },
    metadata: {
      user_id: "00000000-0000-4000-8000-000000000001",
      pack_id: "starter",
      credits: "1000"
    },
    return_url: env.DODO_PAYMENTS_RETURN_URL ?? "https://www.zorixaai.com/billing/success"
  };

  try {
    const session = await client.checkoutSessions.create(checkoutPayload);
    console.log("\ncheckoutSessions.create → OK");
    console.log(JSON.stringify(session, null, 2));
  } catch (err) {
    printApiError("checkoutSessions.create FAILED", err);
  }

  const postCheckout = await rawFetch(baseUrl, apiKey, "POST", "/checkouts", checkoutPayload);
  console.log(`\nRAW POST ${postCheckout.url}`);
  console.log("status:", postCheckout.status, postCheckout.statusText);
  console.log("request body:", JSON.stringify(checkoutPayload, null, 2));
  console.log("response body:", JSON.stringify(postCheckout.body, null, 2));
  if (postCheckout.raw && postCheckout.body._raw) {
    console.log("response raw:", postCheckout.raw);
  }
}

console.log("\n=== Diagnosis hints ===");
console.log("• 401 on test_mode + 422 on live_mode → API key is LIVE-only; products must exist on live.dodopayments.com");
console.log("• 422 Product does not exist → wrong mode, wrong workspace key, or product archived");
console.log("• Dashboard 'Active: 0' → try Products → ⋮ → Unarchive (SDK: products.unarchive)");
console.log("• Preview works in UI but API 422 → preview uses dashboard session, checkout uses REST API + same env as key\n");
