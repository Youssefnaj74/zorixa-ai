import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/stripe/plans";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `checkout:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { planId?: string };
  const plan = getPlan(body.planId ?? "");

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    success_url: `${env.appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/billing/cancel`,
    metadata: {
      user_id: user.id,
      plan_id: plan.id,
      credits: String(plan.credits)
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.priceUsd * 100,
          product_data: {
            name: `Zorixa AI — ${plan.name} credits`,
            description: `${plan.credits} credits`
          }
        }
      }
    ]
  });

  return NextResponse.json({ url: session.url });
}

