import { redirect } from "next/navigation";

import { ApiAccessPanel } from "@/components/dashboard/ApiAccessPanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ApiAccessPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/api");
  }

  return <ApiAccessPanel />;
}
