import { NextResponse } from "next/server";

import { verifyLemonSqueezySignature } from "@/lib/lemon-squeezy/verify-signature";
import { sendPurchaseConfirmationEmail } from "@/lib/support-ticket-email";
import { supabaseAdmin } from "@/lib/supabase/admin";

function creditsPerOrder(): number {
  const n = Number(
    process.env.LEMON_SQUEEZY_CREDITS_PER_PURCHASE?.trim() ??
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CREDITS?.trim() ??
      "100"
  );
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 100;
}

type LemonMeta = {
  event_name?: string;
  custom_data?: { user_id?: string };
};

type LemonPayload = {
  meta?: LemonMeta;
  data?: { id?: string | number };
};

export async function POST(request: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "LEMON_SQUEEZY_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("x-signature");

  if (!verifyLemonSqueezySignature(rawBody, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: LemonPayload;
  try {
    payload = JSON.parse(rawBody) as LemonPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (eventName !== "order_created") {
    return NextResponse.json({ received: true });
  }

  const userId = payload.meta?.custom_data?.user_id?.trim();
  const orderId = payload.data?.id != null ? String(payload.data.id) : null;

  if (!userId || !orderId) {
    return NextResponse.json({ received: true });
  }

  const credits = creditsPerOrder();

  const { data: existing } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("lemonsqueezy_order_id", orderId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  if (!profileErr && profile) {
    await supabaseAdmin
      .from("users_profiles")
      .update({ credits_balance: profile.credits_balance + credits })
      .eq("id", userId);
  }

  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "purchase",
    credits_amount: credits,
    lemonsqueezy_order_id: orderId,
    feature_used: null
  });

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const customerEmail = authUser?.user?.email?.trim();
  if (customerEmail) {
    void sendPurchaseConfirmationEmail({
      email: customerEmail,
      credits,
      orderId
    });
  }

  return NextResponse.json({ received: true });
}
