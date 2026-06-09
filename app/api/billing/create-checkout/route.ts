import { createCheckoutSession } from "@dodopayments/core";
import { NextResponse } from "next/server";

import {
  dodoPaymentsEnvironment,
  getDodoApiKey,
  getDodoProductId,
  getDodoReturnUrl,
  packForId
} from "@/lib/dodo-payments/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function checkoutFeatureFlags(existing?: Record<string, boolean>): Record<string, boolean> {
  return {
    ...existing,
    allow_discount_code: false
  };
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

  const pack = packForId(packId);
  const productId = getDodoProductId(packId);
  if (!pack || !productId) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const name =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "Zorixa customer";

  try {
    const session = await createCheckoutSession(
      {
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: {
          email: customerEmail,
          name
        },
        metadata: {
          user_id: user.id,
          pack_id: pack.id,
          credits: String(pack.credits)
        },
        return_url: getDodoReturnUrl(),
        feature_flags: checkoutFeatureFlags()
      },
      {
        bearerToken: apiKey,
        environment: dodoPaymentsEnvironment()
      }
    );

    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (err) {
    console.error("[billing/create-checkout]", err);
    return NextResponse.json({ error: "Could not start checkout. Try again shortly." }, { status: 502 });
  }
}
