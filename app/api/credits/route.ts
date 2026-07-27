import { NextResponse } from "next/server";

import { loadUserProfile } from "@/lib/load-user-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const rl = rateLimit({ key: "credits:global", limit: 600, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ credits_balance: 0 }, { status: 401 });

  const { profile, error } = await loadUserProfile(supabase, user.id);

  if (!profile) {
    return NextResponse.json({ error: error ?? "Profile not found" }, { status: 404 });
  }

  const { data: passRow } = await supabaseAdmin
    .from("users_profiles")
    .select("starter_pass_purchased_at")
    .eq("id", user.id)
    .maybeSingle();

  const starterPassPurchasedAt =
    typeof passRow?.starter_pass_purchased_at === "string"
      ? passRow.starter_pass_purchased_at
      : null;

  const { count: purchaseCount } = await supabaseAdmin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "purchase");

  const starterPassAvailable =
    !profile.is_premium && !starterPassPurchasedAt && (purchaseCount ?? 0) === 0;

  return NextResponse.json({
    credits_balance: profile.credits_balance,
    is_premium: profile.is_premium,
    starter_pass_purchased_at: starterPassPurchasedAt,
    starter_pass_available: starterPassAvailable
  });
}
