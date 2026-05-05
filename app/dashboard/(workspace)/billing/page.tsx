import { redirect } from "next/navigation";

import { BillingCheckout } from "@/components/billing/BillingCheckout";
import { getCreditsPerPurchase, getLemonSqueezyCheckoutUrl } from "@/lib/lemon-squeezy/checkout-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/billing");
  }

  const checkoutUrl = getLemonSqueezyCheckoutUrl(user.id);
  const creditsAmount = getCreditsPerPurchase();

  return (
    <BillingCheckout checkoutUrl={checkoutUrl} creditsAmount={creditsAmount} userEmail={user.email ?? null} />
  );
}
