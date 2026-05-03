import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  const oauthDescription = url.searchParams.get("error_description");
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect") ?? "/dashboard";
  const safePath =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";

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
      const login = new URL("/login", url.origin);
      login.searchParams.set("error", error.message);
      return NextResponse.redirect(login);
    }
    return NextResponse.redirect(new URL(safePath, url.origin));
  }

  const login = new URL("/login", url.origin);
  login.searchParams.set("error", "Missing authorization code. Try signing in again.");
  return NextResponse.redirect(login);
}
