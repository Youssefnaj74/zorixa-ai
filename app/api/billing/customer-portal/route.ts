import DodoPayments from "dodopayments";
import { NextResponse } from "next/server";

import { dodoPaymentsEnvironment, getDodoApiKey, getDodoReturnUrl } from "@/lib/dodo-payments/config";
import { resolveDodoCustomerIdByEmail } from "@/lib/dodo-payments/resolve-dodo-customer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function billingReturnUrl(request: Request): string {
  const fromEnv = getDodoReturnUrl().replace(/\/billing\/success\/?$/, "/dashboard/billing");
  if (fromEnv.includes("/dashboard/billing")) return fromEnv;
  return new URL("/dashboard/billing", request.url).toString();
}

/** Authenticated redirect to Dodo customer portal (manage / cancel subscription, update card). */
export async function GET(request: Request) {
  const apiKey = getDodoApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?redirect=/dashboard/billing", request.url));
  }

  const email = user.email?.trim();
  if (!email) {
    return NextResponse.json(
      { error: "Add an email to your account before opening the billing portal." },
      { status: 400 }
    );
  }

  const resolved = await resolveDodoCustomerIdByEmail(email);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 404 });
  }

  const client = new DodoPayments({
    bearerToken: apiKey,
    environment: dodoPaymentsEnvironment()
  });

  try {
    const session = await client.customers.customerPortal.create(resolved.customerId, {
      return_url: billingReturnUrl(request)
    });

    if (!session.link?.startsWith("https://")) {
      return NextResponse.json({ error: "Could not open billing portal." }, { status: 502 });
    }

    const wantsJson = request.headers.get("accept")?.includes("application/json");
    if (wantsJson) {
      return NextResponse.json({ url: session.link });
    }

    return NextResponse.redirect(session.link);
  } catch (err) {
    console.error("[billing/customer-portal]", err);
    return NextResponse.json({ error: "Could not open billing portal. Try again shortly." }, { status: 502 });
  }
}
