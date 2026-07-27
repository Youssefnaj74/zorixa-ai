import DodoPayments from "dodopayments";
import { NextResponse } from "next/server";

import {
  dodoPaymentsEnvironment,
  getDodoApiKey,
  getDodoProductId,
  getDodoReturnUrl,
  isStarterPassId,
  offerForId
} from "@/lib/dodo-payments/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function checkoutFeatureFlags(existing?: Record<string, boolean>): Record<string, boolean> {
  return {
    ...existing,
    allow_discount_code: false,
    allow_phone_number_collection: false,
    require_phone_number: false
  };
}

async function isEligibleForStarterPass(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: profile, error } = await supabaseAdmin
    .from("users_profiles")
    .select("is_premium, starter_pass_purchased_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[billing/create-checkout] profile read failed", error.message);
    return { ok: false, error: "Could not verify eligibility. Try again shortly." };
  }

  if (profile?.starter_pass_purchased_at) {
    return { ok: false, error: "Starter Pass is one-time only and already claimed on this account." };
  }

  if (profile?.is_premium) {
    return { ok: false, error: "Starter Pass is for new users only. You already have a paid plan." };
  }

  const { count, error: txnErr } = await supabaseAdmin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "purchase");

  if (txnErr) {
    console.error("[billing/create-checkout] purchase lookup failed", txnErr.message);
    return { ok: false, error: "Could not verify eligibility. Try again shortly." };
  }

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "Starter Pass is for new users only. This account already has a purchase history."
    };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  const apiKey = getDodoApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerEmail = user.email?.trim();
  if (!customerEmail) {
    return NextResponse.json({ error: "Add an email to your account before subscribing." }, { status: 400 });
  }

  let body: { packId?: string; billing?: string };
  try {
    body = (await request.json()) as { packId?: string; billing?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const packId = body.packId?.trim();
  if (!packId) {
    return NextResponse.json({ error: "Missing packId" }, { status: 400 });
  }

  if (body.billing === "yearly") {
    return NextResponse.json(
      { error: "Yearly subscriptions are coming soon. Please choose Monthly for now." },
      { status: 400 }
    );
  }

  const offer = offerForId(packId);
  const productId = getDodoProductId(packId);
  if (!offer || !productId) {
    return NextResponse.json(
      {
        error: isStarterPassId(packId)
          ? "Starter Pass is not configured yet (missing DODO_PRODUCT_STARTER_PASS)."
          : "Unknown plan"
      },
      { status: 400 }
    );
  }

  if (isStarterPassId(packId)) {
    const eligible = await isEligibleForStarterPass(user.id);
    if (!eligible.ok) {
      return NextResponse.json({ error: eligible.error }, { status: 403 });
    }
  }

  const name =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "Zorixa customer";

  try {
    const client = new DodoPayments({
      bearerToken: apiKey,
      environment: dodoPaymentsEnvironment()
    });

    // Tax is location-based (Dodo MoR). We intentionally do not set billing_address,
    // billing_currency, or amount overrides — those would be the only ways to alter tax.
    const checkoutPayload = {
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: customerEmail,
        name
      },
      metadata: {
        user_id: user.id,
        pack_id: offer.id,
        credits: String(offer.credits),
        billing: offer.billing
      },
      return_url: getDodoReturnUrl(),
      minimal_address: true,
      feature_flags: checkoutFeatureFlags()
    };

    console.info("[billing/create-checkout] payload", {
      environment: dodoPaymentsEnvironment(),
      pack_id: offer.id,
      product_id: productId,
      minimal_address: checkoutPayload.minimal_address,
      feature_flags: checkoutPayload.feature_flags,
      metadata: checkoutPayload.metadata,
      return_url: checkoutPayload.return_url
    });

    const session = await client.checkoutSessions.create(checkoutPayload);

    console.info("[billing/create-checkout] response", {
      session_id: session.session_id,
      checkout_url: session.checkout_url,
      response_keys: Object.keys(session)
    });

    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (err) {
    console.error("[billing/create-checkout]", err);
    return NextResponse.json({ error: "Could not start checkout. Try again shortly." }, { status: 502 });
  }
}
