/**
 * Starter Pass E2E smoke (local). Does not print secrets.
 * Usage: npx tsx --env-file=.env.local scripts/smoke-starter-pass-e2e.mts
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];
function pass(name: string, detail?: string) {
  checks.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name: string, detail?: string) {
  checks.push({ name, ok: false, detail });
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

function requiredEnv(key: string): string {
  const v = process.env[key]?.trim();
  if (!v) throw new Error(`Missing env ${key}`);
  return v;
}

async function main() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const starterProduct = process.env.DODO_PRODUCT_STARTER_PASS?.trim() || "";
  const dodoEnv = process.env.DODO_PAYMENTS_ENVIRONMENT?.trim() || "(unset)";
  const hasDodoKey = Boolean(process.env.DODO_PAYMENTS_API_KEY?.trim());

  console.log("=== Starter Pass smoke ===");
  console.log(`DODO_PAYMENTS_ENVIRONMENT=${dodoEnv}`);
  console.log(`DODO_PRODUCT_STARTER_PASS configured=${Boolean(starterProduct)}`);
  console.log(`DODO_PAYMENTS_API_KEY configured=${hasDodoKey}`);

  if (!starterProduct) fail("DODO_PRODUCT_STARTER_PASS set", "empty");
  else if (!starterProduct.startsWith("pdt_")) fail("DODO_PRODUCT_STARTER_PASS format", starterProduct.slice(0, 4));
  else pass("DODO_PRODUCT_STARTER_PASS set", `pdt_… (${starterProduct.length} chars)`);

  if (dodoEnv === "live_mode" || dodoEnv === "live") {
    pass("Dodo mode noted", "live_mode — real checkout charge; grant simulated via RPC path");
  } else {
    pass("Dodo mode noted", dodoEnv);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws as unknown as typeof WebSocket }
  });

  // Confirm column exists
  const { error: colErr } = await admin
    .from("users_profiles")
    .select("starter_pass_purchased_at")
    .limit(1);
  if (colErr) fail("DB column starter_pass_purchased_at", colErr.message);
  else pass("DB column starter_pass_purchased_at");

  const stamp = Date.now();
  const email = `starterpass.smoke.${stamp}@example.com`;
  const password = `SmokeTest!${stamp}`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Starter Pass Smoke" }
  });
  if (createErr || !created.user) {
    fail("Create verified user", createErr?.message ?? "no user");
    printSummary();
    process.exit(1);
  }
  const userId = created.user.id;
  pass("Create verified user", `id=${userId.slice(0, 8)}…`);

  // Wait briefly for handle_new_user trigger (if present)
  await new Promise((r) => setTimeout(r, 800));

  let { data: existingProfile } = await admin
    .from("users_profiles")
    .select("id, credits_balance, is_premium, starter_pass_purchased_at")
    .eq("id", userId)
    .maybeSingle();

  if (!existingProfile) {
    // Insert WITHOUT credits_balance so Postgres column DEFAULT is exercised.
    const { error: insErr } = await admin.from("users_profiles").insert({
      id: userId,
      email,
      full_name: "Starter Pass Smoke",
      is_premium: false
    });
    if (insErr) {
      fail("Ensure profile (default insert)", insErr.message);
      printSummary();
      process.exit(1);
    }
    const reread = await admin
      .from("users_profiles")
      .select("id, credits_balance, is_premium, starter_pass_purchased_at")
      .eq("id", userId)
      .maybeSingle();
    existingProfile = reread.data;
  }

  if (!existingProfile) {
    fail("Profile readable after create");
    printSummary();
    process.exit(1);
  }

  if (existingProfile.credits_balance !== 0) {
    fail(
      "New user credits_balance DEFAULT === 0",
      `got ${existingProfile.credits_balance} (production default still wrong?)`
    );
  } else {
    pass("New user credits_balance DEFAULT === 0");
  }

  if (existingProfile.is_premium) fail("New user is_premium === false");
  else pass("New user is_premium === false");

  // Grant path mirrored (RPC + premium/starter_pass flags) without importing Next admin client.
  const paymentId = `smoke_pay_${stamp}`;
  const orderRef = `dodo:payment:${paymentId}`;

  const resolved = {
    userId,
    credits: 250,
    orderRef,
    packId: "starter-pass" as const
  };

  // Soft check resolveGrant via dynamic import of pure module only
  const { resolveGrantFromPaymentData } = await import("../lib/dodo-payments/resolve-grant.ts");
  const { getDodoProductId, offerForId } = await import("../lib/dodo-payments/config.ts");

  const offer = offerForId("starter-pass");
  const productId = getDodoProductId("starter-pass");
  if (!offer || offer.credits !== 250) fail("Catalog starter-pass = 250", JSON.stringify(offer));
  else pass("Catalog starter-pass = 250");

  if (!productId) fail("getDodoProductId(starter-pass)");
  else if (productId !== starterProduct) fail("Product id matches env", "mismatch");
  else pass("getDodoProductId(starter-pass) matches env");

  const resolvedEvent = resolveGrantFromPaymentData({
    payment_id: paymentId,
    product_id: productId,
    metadata: {
      user_id: userId,
      pack_id: "starter-pass",
      credits: "250",
      billing: "one_time"
    }
  });
  if (resolvedEvent.status !== "grant") {
    fail("resolveGrantFromPaymentData", JSON.stringify(resolvedEvent));
    printSummary();
    process.exit(1);
  }
  if (resolvedEvent.grant.credits !== 250) fail("Resolved credits 250", String(resolvedEvent.grant.credits));
  else pass("resolveGrantFromPaymentData → 250 credits");
  if (resolvedEvent.grant.packId !== "starter-pass") {
    fail("Resolved packId starter-pass", String(resolvedEvent.grant.packId));
  } else pass("resolveGrantFromPaymentData → packId starter-pass");

  async function grantOnce(): Promise<{ duplicate: boolean; granted: boolean }> {
    const { data: rpcResult, error: rpcErr } = await admin.rpc("grant_purchase_credits", {
      p_user_id: resolved.userId,
      p_credits: resolved.credits,
      p_order_ref: resolved.orderRef
    });
    if (rpcErr) {
      if (rpcErr.code === "23505") return { duplicate: true, granted: false };
      throw new Error(rpcErr.message);
    }
    if (rpcResult === "duplicate") return { duplicate: true, granted: false };
    if (rpcResult !== "granted") return { duplicate: false, granted: false };

    const { error: premErr } = await admin
      .from("users_profiles")
      .update({
        is_premium: true,
        starter_pass_purchased_at: new Date().toISOString()
      })
      .eq("id", resolved.userId);
    if (premErr) throw new Error(premErr.message);
    return { duplicate: false, granted: true };
  }

  const first = await grantOnce();
  if (!first.granted || first.duplicate) fail("First grantPackCredits", JSON.stringify(first));
  else pass("First grantPackCredits granted");

  const { data: afterGrant, error: afterErr } = await admin
    .from("users_profiles")
    .select("credits_balance, is_premium, starter_pass_purchased_at")
    .eq("id", userId)
    .single();
  if (afterErr || !afterGrant) fail("Read profile after grant", afterErr?.message);
  else {
    if (afterGrant.credits_balance !== 250) fail("credits_balance === 250", String(afterGrant.credits_balance));
    else pass("credits_balance === 250");
    if (afterGrant.is_premium !== true) fail("is_premium === true");
    else pass("is_premium === true");
    if (!afterGrant.starter_pass_purchased_at) fail("starter_pass_purchased_at populated");
    else pass("starter_pass_purchased_at populated", String(afterGrant.starter_pass_purchased_at));
  }

  const { count: txnCount, error: txnErr } = await admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "purchase");
  if (txnErr) fail("Count purchase txns", txnErr.message);
  else if (txnCount !== 1) fail("Exactly one purchase txn", `count=${txnCount}`);
  else pass("Exactly one purchase txn");

  const second = await grantOnce();
  if (!second.duplicate || second.granted) fail("Replay grant is duplicate", JSON.stringify(second));
  else pass("Replay grant is duplicate (no double credit)");

  const { data: afterReplay } = await admin
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();
  if (afterReplay?.credits_balance !== 250) fail("Balance unchanged after replay", String(afterReplay?.credits_balance));
  else pass("Balance unchanged after replay");

  const { count: txnCount2 } = await admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "purchase");
  if (txnCount2 !== 1) fail("Still one purchase txn after replay", `count=${txnCount2}`);
  else pass("Still one purchase txn after replay");

  const { data: eligProfile } = await admin
    .from("users_profiles")
    .select("is_premium, starter_pass_purchased_at")
    .eq("id", userId)
    .maybeSingle();
  const blocked =
    Boolean(eligProfile?.starter_pass_purchased_at) ||
    Boolean(eligProfile?.is_premium) ||
    (txnCount2 ?? 0) > 0;
  if (!blocked) fail("Second Starter Pass checkout would be blocked");
  else pass("Second Starter Pass checkout would be blocked");

  console.log("\nBROWSER_CREDS_JSON=" + JSON.stringify({ email, password, userId }));

  printSummary();
  const failed = checks.filter((c) => !c.ok).length;
  process.exit(failed ? 1 : 0);
}

function printSummary() {
  const failed = checks.filter((c) => !c.ok).length;
  const ok = checks.filter((c) => c.ok).length;
  console.log(`\n=== Summary: ${ok} passed, ${failed} failed ===`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
