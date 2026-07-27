import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { requestIp } from "@/lib/content-moderation";
import { env } from "@/lib/env";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { rateLimitResponse } from "@/lib/rate-limit";
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

  const url = env.supabase.url;
  const anon = env.supabase.anonKey;
  if (!url || !anon) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const supabase = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

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
    needsEmailConfirmation: !hasSession
  });
}
