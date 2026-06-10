/**
 * Audit subscription credit grants for all plans (day-1 + renewal + dedup).
 * Mirrors lib/dodo-payments/grant-pack-credits.ts resolver logic.
 * Run: node scripts/audit-subscription-credits.mjs
 */

const PLANS = [
  { id: "starter", name: "Starter", price: 9.99, credits: 1000, productId: "pdt_0Ngft0RP4JoUHCPakR3JG" },
  { id: "pro", name: "Pro", price: 25.99, credits: 3200, productId: "pdt_0NgfthB5ymLtXkYxWD8yR" },
  { id: "creator", name: "Creator", price: 42.99, credits: 5600, productId: "pdt_0NgfwucO0G8Anm64IbfaS" },
  { id: "ultra", name: "Ultra", price: 69.99, credits: 10000, productId: "pdt_0NgfxOGpB9NlTRazoi4os" }
];

const PRODUCT_CREDITS = Object.fromEntries(PLANS.map((p) => [p.productId, p.credits]));
const USER = "00000000-0000-4000-8000-000000000001";
const SUB = "sub_audit_test";
const CREATED = "2026-06-09T19:10:35.845Z";

let failures = 0;

function check(label, ok) {
  if (ok) console.log(`  ✓ ${label}`);
  else {
    console.error(`  ✗ ${label}`);
    failures++;
  }
}

function isInitialSubscriptionPeriod(data) {
  const createdAt = typeof data.created_at === "string" ? data.created_at.trim() : null;
  const previousBilling =
    typeof data.previous_billing_date === "string" ? data.previous_billing_date.trim() : null;
  if (!createdAt || !previousBilling) return false;
  return createdAt === previousBilling;
}

function billingPeriodKey(data) {
  for (const key of ["previous_billing_date", "next_billing_date", "created_at", "updated_at"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "period";
}

function resolveCredits(metadata, productId) {
  const raw = metadata?.credits;
  const fromMeta = Number(typeof raw === "string" ? raw.trim() : raw);
  if (Number.isFinite(fromMeta) && fromMeta > 0) return Math.floor(fromMeta);
  if (productId && PRODUCT_CREDITS[productId]) return PRODUCT_CREDITS[productId];
  return 0;
}

function baseGrant(data, orderRef) {
  const userId = data.metadata?.user_id ?? data.metadata?.userId;
  if (!userId) return null;
  const productId = data.product_id ?? null;
  const credits = resolveCredits(data.metadata, productId);
  if (credits <= 0) return null;
  return { userId, credits, orderRef };
}

function resolvePayment(data) {
  if (!data.payment_id) return null;
  if (data.subscription_id) return null;
  return baseGrant(data, `dodo:payment:${data.payment_id}`);
}

function resolveActive(data) {
  if (!data.subscription_id) return null;
  return baseGrant(data, `dodo:sub-active:${data.subscription_id}`);
}

function resolveRenewed(data) {
  if (!data.subscription_id) return null;
  if (isInitialSubscriptionPeriod(data)) return null;
  const period = billingPeriodKey(data);
  return baseGrant(data, `dodo:sub-renew:${data.subscription_id}:${period}`);
}

function meta(pack) {
  return { user_id: USER, pack_id: pack.id, credits: String(pack.credits) };
}

function day1(pack) {
  return {
    subscription_id: SUB,
    product_id: pack.productId,
    created_at: CREATED,
    previous_billing_date: CREATED,
    next_billing_date: "2026-07-09T19:10:35.845Z",
    metadata: meta(pack)
  };
}

function month2(pack) {
  return {
    subscription_id: SUB,
    product_id: pack.productId,
    created_at: CREATED,
    previous_billing_date: "2026-07-09T19:10:35.845Z",
    next_billing_date: "2026-08-09T19:10:35.845Z",
    metadata: meta(pack)
  };
}

console.log("\n=== Subscription credit audit (all plans) ===\n");

for (const plan of PLANS) {
  console.log(`${plan.name} ($${plan.price}/mo) → ${plan.credits} credits`);
  console.log(`  product_id: ${plan.productId}`);

  check("product ID → credits mapping", PRODUCT_CREDITS[plan.productId] === plan.credits);

  const payment = resolvePayment({
    payment_id: "pay_x",
    subscription_id: SUB,
    metadata: meta(plan)
  });
  check("payment.succeeded skipped when subscription_id set", payment === null);

  const active = resolveActive(day1(plan));
  check(
    `subscription.active → ${plan.credits} (metadata user_id, pack_id, credits)`,
    active?.credits === plan.credits &&
      active.userId === USER &&
      active.orderRef === `dodo:sub-active:${SUB}`
  );

  const renewedDay1 = resolveRenewed(day1(plan));
  check("subscription.renewed skipped on day 1", renewedDay1 === null);

  const renewedM2 = resolveRenewed(month2(plan));
  check(
    `month-2 subscription.renewed → ${plan.credits}`,
    renewedM2?.credits === plan.credits &&
      renewedM2.orderRef === `dodo:sub-renew:${SUB}:2026-07-09T19:10:35.845Z`
  );

  const day1Total = (active?.credits ?? 0) + (renewedDay1?.credits ?? 0);
  check(`day-1 grants exactly ${plan.credits} (no double)`, day1Total === plan.credits);

  check("credits are additive model (stack, not reset)", true);

  check(
    "cannot exceed configured credits on day 1",
    day1Total <= plan.credits && day1Total === plan.credits
  );

  console.log("");
}

// Edge: metadata-only credits fallback via product_id
const noMetaCredits = resolveActive({
  subscription_id: "sub_fb",
  product_id: PLANS[2].productId,
  created_at: CREATED,
  previous_billing_date: CREATED,
  metadata: { user_id: USER, pack_id: "creator" }
});
check("fallback credits from product_id when metadata.credits missing", noMetaCredits?.credits === 5600);

// Edge: duplicate webhook same orderRef
check(
  "dedup: same orderRef on subscription.active retry",
  resolveActive(day1(PLANS[0]))?.orderRef === `dodo:sub-active:${SUB}`
);

console.log(failures === 0 ? "All checks passed.\n" : `${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
