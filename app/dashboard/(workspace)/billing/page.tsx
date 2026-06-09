import { redirect } from "next/navigation";

import { BillingCheckout } from "@/components/billing/BillingCheckout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardBillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/billing");
  }

  return <BillingCheckout userEmail={user.email ?? null} />;
}
