import { NextResponse } from "next/server";

import { requestIp } from "@/lib/content-moderation";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { rateLimitResponse } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";

type Body = {
  email?: string;
  password?: string;
  fullName?: string;
  turnstileToken?: string;
};

export async function POST(request: Request) {
  const ip = requestIp(request);

  const limited = await rateLimitResponse({
    key: `signup:${ip}`,
    limit: 3,
    windowMs: 24 * 60 * 60_000,
    message: "Too many signup attempts from this network. Try again tomorrow."
  });
  if (limited) return limited;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (isTurnstileConfigured()) {
    const captcha = await verifyTurnstileToken({
      token: body.turnstileToken,
      ip
    });
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }
  }

  // SSR client writes auth cookies onto the response so the browser is logged in
  // immediately when Supabase returns a session (email confirm disabled).
  const supabase = await createSupabaseServerClient();

  const emailRedirectTo = `${getPublicSiteUrl()}/auth/callback?signup=1&redirect=${encodeURIComponent("/dashboard")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: fullName ? { full_name: fullName } : undefined
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const hasSession = Boolean(data.session);
  const userId = data.user?.id ?? null;

  return NextResponse.json({
    ok: true,
    userId,
    /** When false, Supabase requires email confirmation before a session exists. */
    session: hasSession,
    needsEmailConfirmation: !hasSession,
    /** Browser must call setSession — SSR cookies alone are not always applied on JSON responses. */
    access_token: data.session?.access_token ?? null,
    refresh_token: data.session?.refresh_token ?? null
  });
}
