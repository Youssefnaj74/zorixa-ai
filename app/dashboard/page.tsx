import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let credits = 0;
  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("users_profiles")
      .select("credits_balance, full_name")
      .eq("id", user.id)
      .single();

    credits = profile?.credits_balance ?? 0;
    displayName =
      profile?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null;
  }

  const creditsDisplay = credits >= 1000 ? `${(credits / 1000).toFixed(1)}k` : String(credits);

  return <DashboardHome creditsDisplay={creditsDisplay} displayName={displayName} />;
}
