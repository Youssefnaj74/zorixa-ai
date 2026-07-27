import { NextResponse } from "next/server";

import { requestIp } from "@/lib/content-moderation";
import { loadUserProfile } from "@/lib/load-user-profile";
import { PRICING_WELCOME_PATH } from "@/lib/post-signup-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { grantTrialCreditsIfEligible } from "@/lib/trial-credits";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  const oauthDescription = url.searchParams.get("error_description");
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect") ?? "/dashboard";
  const safePath =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";
  const isSignupFlow = url.searchParams.get("signup") === "1";
  const authType = url.searchParams.get("type");

  if (oauthError) {
    const login = new URL("/login", url.origin);
    login.searchParams.set(
      "error",
      oauthDescription?.replace(/\+/g, " ") || oauthError
    );
    return NextResponse.redirect(login);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const login = new URL(
        authType === "recovery" || safePath === "/reset-password"
          ? "/forgot-password"
          : "/login",
        url.origin
      );
      login.searchParams.set("error", error.message);
      return NextResponse.redirect(login);
    }

    // Password recovery links should land on the reset form, not the dashboard.
    if (authType === "recovery" || safePath === "/reset-password") {
      return NextResponse.redirect(new URL("/reset-password", url.origin));
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      await grantTrialCreditsIfEligible({
        userId: user.id,
        ip: requestIp(request)
      });
    }

    let destination = safePath;
    if (isSignupFlow && user) {
      const { profile } = await loadUserProfile(supabase, user.id);
      if ((profile?.credits_balance ?? 0) <= 0) {
        destination = PRICING_WELCOME_PATH;
      }
    }

    return NextResponse.redirect(new URL(destination, url.origin));
  }

  const login = new URL("/login", url.origin);
  login.searchParams.set("error", "Missing authorization code. Try signing in again.");
  return NextResponse.redirect(login);
}
