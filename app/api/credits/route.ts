import { NextResponse } from "next/server";

import { requestIp } from "@/lib/content-moderation";
import { loadUserProfile } from "@/lib/load-user-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { grantTrialCreditsIfEligible } from "@/lib/trial-credits";

export async function GET(request: Request) {
  const rl = rateLimit({ key: "credits:global", limit: 600, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ credits_balance: 0 }, { status: 401 });

  // Opportunistic trial grant after email verify (idempotent).
  await grantTrialCreditsIfEligible({
    userId: user.id,
    ip: requestIp(request)
  });

  const { profile, error } = await loadUserProfile(supabase, user.id);

  if (!profile) {
    return NextResponse.json({ error: error ?? "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    credits_balance: profile.credits_balance,
    is_premium: profile.is_premium
  });
}
