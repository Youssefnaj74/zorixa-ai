import { redirect } from "next/navigation";

import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { getLemonSqueezyCheckoutUrl } from "@/lib/lemon-squeezy/checkout-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WELCOME_TAGLINES = [
  "Ship something beautiful today — one creative step at a time.",
  "Your next standout asset is a single click away.",
  "Small experiments today become big wins tomorrow.",
  "Quality compounds — keep refining, keep generating.",
  "The best campaigns start with crisp visuals. You’ve got this.",
  "Momentum beats perfection. Let’s make progress.",
  "Premium results come from showing up — you’re already here."
] as const;

function welcomeTaglineFor(userId: string): string {
  const day = new Date().getUTCDate();
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h + userId.charCodeAt(i) * (i + 1)) % 2147483647;
  const idx = (h + day) % WELCOME_TAGLINES.length;
  return WELCOME_TAGLINES[idx];
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("credits_balance, full_name, is_premium")
    .eq("id", user.id)
    .single();

  const credits = profile?.credits_balance ?? 0;
  const displayName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  const isPremium = profile?.is_premium ?? false;

  const { data: generations } = await supabase
    .from("generations")
    .select("id, feature_type, output_url, input_url, status, created_at, provider")
    .order("created_at", { ascending: false })
    .limit(12);

  const creditsDisplay = credits >= 1000 ? `${(credits / 1000).toFixed(1)}k` : String(credits);

  const upgradeHref = getLemonSqueezyCheckoutUrl(user.id) ?? "/pricing";
  const welcomeTagline = welcomeTaglineFor(user.id);

  return (
    <DashboardHome
      credits={credits}
      creditsDisplay={creditsDisplay}
      displayName={displayName}
      userEmail={user.email ?? null}
      isPremium={isPremium}
      upgradeHref={upgradeHref}
      welcomeTagline={welcomeTagline}
      generations={generations ?? []}
    />
  );
}
