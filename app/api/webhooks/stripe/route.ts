import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const userId = session?.metadata?.user_id as string | undefined;
    const credits = Number(session?.metadata?.credits ?? 0);
    const paymentId = session?.payment_intent as string | null;

    if (userId && credits > 0) {
      // increment credits balance
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
        stripe_payment_id: paymentId,
        feature_used: null
      });
    }
  }

  return NextResponse.json({ received: true });
}

