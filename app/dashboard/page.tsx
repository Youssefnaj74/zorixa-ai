import { redirect } from "next/navigation";

import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { getLemonSqueezyCheckoutUrl } from "@/lib/lemon-squeezy/checkout-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    .select("id, feature_type, output_url, input_url, status, created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  const creditsDisplay = credits >= 1000 ? `${(credits / 1000).toFixed(1)}k` : String(credits);

  const upgradeHref = getLemonSqueezyCheckoutUrl(user.id) ?? "/dashboard/billing";

  return (
    <DashboardHome
      creditsDisplay={creditsDisplay}
      displayName={displayName}
      isPremium={isPremium}
      upgradeHref={upgradeHref}
      generations={generations ?? []}
    />
  );
}
