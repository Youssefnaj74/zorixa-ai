import { NextResponse } from "next/server";

import { fetchBillingSummaryForEmail } from "@/lib/dodo-payments/billing-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email?.trim();
  if (!email) {
    return NextResponse.json(
      { error: "Add an email to your account to view billing." },
      { status: 400 }
    );
  }

  try {
    const result = await fetchBillingSummaryForEmail(email);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }
    return NextResponse.json(result.summary);
  } catch (err) {
    console.error("[billing/summary]", err);
    return NextResponse.json({ error: "Could not load billing details." }, { status: 502 });
  }
}
