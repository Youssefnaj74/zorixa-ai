/**
 * Verify Dodo Payments integration (product IDs, checkout session, webhook verify, grant resolver).
 * Run: npm run verify:dodo
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCheckoutSession } from "@dodopayments/core";
import { verifyWebhookPayload } from "@dodopayments/core/webhook";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const EXPECTED_PRODUCTS = {
  starter: { id: "pdt_0Ngft0RP4JoUHCPakR3JG", credits: 1000 },
  pro: { id: "pdt_0NgfthB5ymLtXkYxWD8yR", credits: 3200 },
  creator: { id: "pdt_0NgfwucO0G8Anm64IbfaS", credits: 5600 },
  ultra: { id: "pdt_0NgfxOGpB9NlTRazoi4os", credits: 10000 }
};

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

function ok(label) {
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

const env = {
  ...parseEnvFile(path.join(root, ".env.local")),
  ...process.env
};

const apiKey = (env.DODO_PAYMENTS_API_KEY ?? "").trim();
const webhookKey = (env.DODO_PAYMENTS_WEBHOOK_KEY ?? env.DODO_WEBHOOK_SECRET ?? "").trim();
const environment =
  (env.DODO_PAYMENTS_ENVIRONMENT ?? "live_mode").trim().toLowerCase() === "test_mode"
    ? "test_mode"
    : "live_mode";
const returnUrl =
  (env.DODO_PAYMENTS_RETURN_URL ?? "https://www.zorixaai.com/billing/success").trim();

let errors = 0;

console.log("\n=== Dodo Payments verification ===\n");

// 1. Product IDs (defaults match lib/dodo-payments/config.ts)
console.log("1. Product ID resolution");
for (const [pack, expected] of Object.entries(EXPECTED_PRODUCTS)) {
  const envKey = `DODO_PRODUCT_${pack.toUpperCase()}`;
  const resolved = (env[envKey] ?? expected.id).trim();
  if (resolved === expected.id) {
    ok(`${pack} → ${resolved} (${expected.credits} credits)`);
  } else {
    fail(`${pack}`, `expected ${expected.id}, got ${resolved}`);
    errors++;
  }
}

// 2. Grant resolver (mirrors lib/dodo-payments/grant-pack-credits.ts)
console.log("\n2. payment.succeeded grant resolver");
const testUserId = "00000000-0000-4000-8000-000000000001";

function resolvePaymentGrant(data) {
  const paymentId = typeof data.payment_id === "string" ? data.payment_id.trim() : null;
  if (!paymentId) return null;
  if (typeof data.subscription_id === "string" && data.subscription_id.trim()) return null;
  const meta = data.metadata ?? {};
  const userId = meta.user_id ?? meta.userId;
  if (!userId) return null;
  let credits = Number(meta.credits);
  if (!credits) {
    const pid = data.product_cart?.[0]?.product_id ?? data.product_id;
    credits = EXPECTED_PRODUCTS[Object.keys(EXPECTED_PRODUCTS).find(
      (k) => EXPECTED_PRODUCTS[k].id === pid
    )]?.credits ?? 0;
  }
  if (!credits) return null;
  return { userId, credits, orderRef: `dodo:payment:${paymentId}` };
}

function resolveSubActiveGrant(data) {
  const subId = data.subscription_id?.trim?.() ?? data.subscription_id;
  if (!subId) return null;
  const meta = data.metadata ?? {};
  const userId = meta.user_id;
  if (!userId) return null;
  const pid = data.product_id;
  const credits =
    Number(meta.credits) ||
    EXPECTED_PRODUCTS[Object.keys(EXPECTED_PRODUCTS).find((k) => EXPECTED_PRODUCTS[k].id === pid)]?.credits;
  if (!credits) return null;
  return { userId, credits, orderRef: `dodo:sub-active:${subId}` };
}

const oneTimePayment = resolvePaymentGrant({
  payment_id: "pay_test_1",
  metadata: { user_id: testUserId, credits: "1000" },
  product_cart: [{ product_id: EXPECTED_PRODUCTS.starter.id, quantity: 1 }]
});
if (oneTimePayment?.credits === 1000 && oneTimePayment.orderRef === "dodo:payment:pay_test_1") {
  ok("one-time payment.succeeded → 1000 credits");
} else {
  fail("one-time payment.succeeded resolver", JSON.stringify(oneTimePayment));
  errors++;
}

const subPaymentSkipped = resolvePaymentGrant({
  payment_id: "pay_test_2",
  subscription_id: "sub_test_1",
  metadata: { user_id: testUserId, credits: "1000" }
});
if (subPaymentSkipped === null) {
  ok("subscription payment.succeeded skipped (uses subscription.active instead)");
} else {
  fail("subscription payment should be skipped", JSON.stringify(subPaymentSkipped));
  errors++;
}

const subActive = resolveSubActiveGrant({
  subscription_id: "sub_test_1",
  product_id: EXPECTED_PRODUCTS.starter.id,
  metadata: { user_id: testUserId, credits: "1000" }
});
if (subActive?.credits === 1000) {
  ok("subscription.active → 1000 credits");
} else {
  fail("subscription.active resolver", JSON.stringify(subActive));
  errors++;
}

function resolveSubRenewedGrant(data) {
  const subId = data.subscription_id?.trim?.() ?? data.subscription_id;
  if (!subId) return null;
  const createdAt = data.created_at?.trim?.() ?? data.created_at;
  const prevBilling = data.previous_billing_date?.trim?.() ?? data.previous_billing_date;
  if (createdAt && prevBilling && createdAt === prevBilling) return null;
  const meta = data.metadata ?? {};
  const userId = meta.user_id;
  if (!userId) return null;
  const pid = data.product_id;
  const credits =
    Number(meta.credits) ||
    EXPECTED_PRODUCTS[Object.keys(EXPECTED_PRODUCTS).find((k) => EXPECTED_PRODUCTS[k].id === pid)]?.credits;
  if (!credits) return null;
  const period = prevBilling || data.next_billing_date || "period";
  return { userId, credits, orderRef: `dodo:sub-renew:${subId}:${period}` };
}

const initialRenewSkipped = resolveSubRenewedGrant({
  subscription_id: "sub_0Nggy1a15yxw8PhmYZEhZ",
  created_at: "2026-06-09T19:10:35.845Z",
  previous_billing_date: "2026-06-09T19:10:35.845Z",
  product_id: EXPECTED_PRODUCTS.starter.id,
  metadata: { user_id: testUserId, credits: "1000" }
});
if (initialRenewSkipped === null) {
  ok("initial subscription.renewed skipped (subscription.active grants first period)");
} else {
  fail("initial subscription.renewed should be skipped", JSON.stringify(initialRenewSkipped));
  errors++;
}

const monthTwoRenew = resolveSubRenewedGrant({
  subscription_id: "sub_test_1",
  created_at: "2026-06-09T19:10:35.845Z",
  previous_billing_date: "2026-07-09T19:10:35.845Z",
  product_id: EXPECTED_PRODUCTS.starter.id,
  metadata: { user_id: testUserId, credits: "1000" }
});
if (monthTwoRenew?.credits === 1000) {
  ok("month-2 subscription.renewed → 1000 credits");
} else {
  fail("month-2 subscription.renewed resolver", JSON.stringify(monthTwoRenew));
  errors++;
}

// 3. Webhook signature validation
console.log("\n3. Webhook signature validation");
if (!webhookKey) {
  fail("DODO_PAYMENTS_WEBHOOK_KEY missing — cannot test signature");
  errors++;
} else {
  const fakeBody = JSON.stringify({
    type: "payment.succeeded",
    data: { payment_id: "pay_x", metadata: { user_id: testUserId } }
  });
  try {
    await verifyWebhookPayload({
      webhookKey,
      headers: { "webhook-signature": "v1,invalid" },
      body: fakeBody
    });
    fail("invalid signature should reject");
    errors++;
  } catch {
    ok("invalid signature rejected");
  }

  try {
    await verifyWebhookPayload({
      webhookKey,
      headers: {},
      body: fakeBody
    });
    fail("missing signature should reject");
    errors++;
  } catch {
    ok("missing signature rejected");
  }
}

// 4. Live checkout session (requires API key)
console.log("\n4. Checkout session (Dodo API)");
if (!apiKey) {
  fail("DODO_PAYMENTS_API_KEY missing — cannot create checkout session");
  errors++;
} else {
  try {
    const session = await createCheckoutSession(
      {
        product_cart: [{ product_id: EXPECTED_PRODUCTS.starter.id, quantity: 1 }],
        customer: { email: "verify@zorixaai.com", name: "Verify Bot" },
        metadata: {
          user_id: testUserId,
          pack_id: "starter",
          credits: "1000"
        },
        return_url: returnUrl
      },
      { bearerToken: apiKey, environment }
    );
    if (session.checkout_url?.startsWith("https://")) {
      ok(`checkout session created (${environment})`);
      console.log(`     url: ${session.checkout_url.slice(0, 72)}…`);
    } else {
      fail("checkout session missing checkout_url", JSON.stringify(session));
      errors++;
    }
  } catch (e) {
    fail("createCheckoutSession", e instanceof Error ? e.message : String(e));
    errors++;
  }
}

// 5. Lemon Squeezy checkout references in app UI
console.log("\n5. Lemon Squeezy checkout references (app UI)");
const lemonCheckoutPatterns = [
  "getLemonSqueezyCheckoutUrl",
  "createLemonSqueezy",
  "lemonsqueezy-button",
  "app.lemonsqueezy.com/js/lemon.js",
  "NEXT_PUBLIC_LEMON_SQUEEZY"
];

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walkFiles(p, acc);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !p.includes("lemon-squeezy")) {
      acc.push(p);
    }
  }
  return acc;
}

const uiHits = [];
for (const file of walkFiles(path.join(root, "app")).concat(walkFiles(path.join(root, "components")))) {
  const text = fs.readFileSync(file, "utf8");
  for (const needle of lemonCheckoutPatterns) {
    if (text.includes(needle)) {
      uiHits.push(`${path.relative(root, file)} → ${needle}`);
    }
  }
}

if (uiHits.length === 0) {
  ok("no Lemon checkout UI references in app/components");
} else {
  for (const h of uiHits) fail("Lemon checkout reference", h);
  errors += uiHits.length;
}

console.log("\n---");
if (errors === 0) {
  console.log("All checks passed.\n");
  console.log("Note: subscription plans grant credits via subscription.active /");
  console.log("subscription.renewed — not payment.succeeded (subscription_id set).\n");
  process.exit(0);
} else {
  console.error(`${errors} check(s) failed.\n`);
  process.exit(1);
}
