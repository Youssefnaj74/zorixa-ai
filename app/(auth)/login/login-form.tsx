"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";

import { TurnstileField } from "@/components/auth/TurnstileField";
import { ZorixaLogo } from "@/components/layout/ZorixaLogo";
import loginShowcase from "@/data/login-showcase.json";
import { dashboardFeatureAlt } from "@/lib/image-alt-text";
import { useScheduledAppRouterNavigation } from "@/lib/hooks/use-scheduled-app-router-navigation";
import { completeSignupNavigation, establishBrowserSessionFromSignup } from "@/lib/post-signup-redirect";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { turnstileSiteKey } from "@/lib/turnstile-public";
import { cn } from "@/lib/utils";

const SHOWCASE = loginShowcase.slides;

function LoginShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % SHOWCASE.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = SHOWCASE[active];

  return (
    <div className="relative hidden min-h-dvh overflow-hidden bg-[#06060c] lg:block">
      <Image
        key={slide.image}
        src={slide.image}
        alt={dashboardFeatureAlt(slide.title, slide.badge)}
        fill
        priority
        className="object-cover transition-opacity duration-700"
        sizes="55vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(6,6,12,0.92)_0%,rgba(6,6,12,0.55)_38%,rgba(6,6,12,0.25)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,229,255,0.18),transparent_42%),radial-gradient(circle_at_20%_80%,rgba(131,56,235,0.2),transparent_40%)]" />

      <div className="relative flex h-full min-h-dvh flex-col justify-between p-10 xl:p-14">
        <p className="w-fit rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00e5ff] backdrop-blur">
          Zorixa studio
        </p>

        <div className="max-w-lg">
          <span className="inline-flex rounded-full bg-[#00e5ff]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00e5ff] ring-1 ring-[#00e5ff]/30">
            {slide.badge}
          </span>
          <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-white xl:text-5xl">
            {slide.title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">{slide.tagline}</p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            {SHOWCASE.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  index === active ? "bg-[#00e5ff]" : "bg-white/15 hover:bg-white/25"
                )}
                aria-label={`Show ${item.title}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            {SHOWCASE.map((item, index) => (
              <button
                key={`${item.title}-label`}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "transition-colors hover:text-white/70",
                  index === active && "text-white"
                )}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type AuthMode = "signin" | "signup";

export function LoginForm() {
  const searchParams = useSearchParams();
  const scheduleNavigation = useScheduledAppRouterNavigation();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const urlError = searchParams.get("error");
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);
  const [showEmail, setShowEmail] = useState(initialMode === "signup");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const turnstileRequired = Boolean(turnstileSiteKey());

  const isSignup = mode === "signup";

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setShowEmail(next === "signup");
    setConfirmEmailSent(false);
    setTurnstileToken(null);
  }

  async function onEmailPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    scheduleNavigation(redirectTo, { refresh: true });
  }

  async function onEmailPasswordSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConfirmEmailSent(false);

    if (turnstileRequired && !turnstileToken) {
      setLoading(false);
      setError("Complete the human verification challenge.");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          turnstileToken
        })
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        session?: boolean;
        needsEmailConfirmation?: boolean;
        access_token?: string | null;
        refresh_token?: string | null;
      };

      if (!res.ok) {
        setError(data.error ?? `Signup failed (${res.status})`);
        return;
      }

      if (data.needsEmailConfirmation || !data.session) {
        setConfirmEmailSent(true);
        return;
      }

      const sessionOk = await establishBrowserSessionFromSignup(data);
      if (!sessionOk) {
        setError("Account created, but sign-in failed. Please log in to continue.");
        return;
      }

      await completeSignupNavigation((path, opts) => scheduleNavigation(path, opts));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleLogin() {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const oauthRedirect = isSignup
      ? `${getPublicSiteUrl()}/auth/callback?signup=1&redirect=${encodeURIComponent(redirectTo)}`
      : `${getPublicSiteUrl()}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: oauthRedirect
      }
    });

    setLoading(false);
    if (oauthError) setError(oauthError.message);
  }

  const googleBtn =
    "flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white text-sm font-semibold text-[#1a1a1a] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] transition hover:bg-[#f5f5f5] disabled:opacity-45";
  const emailBtn =
    "flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-[#00e5ff]/35 bg-[#00e5ff]/10 text-sm font-semibold text-[#00e5ff] shadow-[0_0_24px_rgba(0,229,255,0.08)] transition hover:border-[#00e5ff]/55 hover:bg-[#00e5ff]/18 disabled:opacity-45";
  const inputClass =
    "mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/30 transition focus:border-[#00e5ff]/45 focus:ring-2 focus:ring-[#00e5ff]/15";

  return (
    <div className="min-h-dvh bg-[#080810] text-white antialiased">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,480px)_1fr] xl:grid-cols-[minmax(0,520px)_1fr]">
        <section className="relative flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(0,229,255,0.08),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(131,56,235,0.1),transparent_38%)]" />

          <div className="relative">
            <Link
              href="/"
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40 transition hover:text-white"
            >
              ← Home
            </Link>
            <div className="mt-8">
              <ZorixaLogo href="/" textClassName="text-xl font-bold" iconClassName="h-[34px] w-auto" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[22rem] py-10 lg:py-6">
            <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-[2rem]">
              {isSignup ? "Create account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-white/45">
              {isSignup
                ? "Create an account, then claim the $1.10 Starter Pass or subscribe on Pricing."
                : "Sign in to your studio — credits, tools, and generations."}
            </p>

            <div className="mt-8 space-y-3">
              <button type="button" onClick={onGoogleLogin} disabled={loading} className={googleBtn}>
                <svg className="size-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {!showEmail ? (
                <button
                  type="button"
                  onClick={() => setShowEmail(true)}
                  disabled={loading}
                  className={emailBtn}
                >
                  <Mail className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  Continue with email
                </button>
              ) : null}
            </div>

            {showEmail ? (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                    Email
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <form
                  onSubmit={isSignup ? onEmailPasswordSignup : onEmailPasswordLogin}
                  className="space-y-4"
                >
                  {isSignup ? (
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                        Full name
                      </span>
                      <input
                        className={inputClass}
                        placeholder="Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                      />
                    </label>
                  ) : null}
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                      Email
                    </span>
                    <input
                      className={inputClass}
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                      Password
                    </span>
                    <input
                      className={inputClass}
                      placeholder={isSignup ? "At least 8 characters" : "••••••••"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      required
                      minLength={isSignup ? 8 : undefined}
                    />
                  </label>

                  {!isSignup ? (
                    <div className="-mt-1 text-right">
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-[#00e5ff] hover:text-white"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  ) : null}

                  {isSignup ? <TurnstileField onToken={setTurnstileToken} /> : null}

                  {confirmEmailSent ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-xs leading-snug text-emerald-100">
                      Check your inbox to verify <span className="font-semibold">{email.trim()}</span>.
                      After that, claim the Starter Pass or a monthly plan on Pricing.
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs leading-snug text-red-100">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || (isSignup && confirmEmailSent)}
                    className="h-12 w-full rounded-2xl bg-[#00e5ff] text-sm font-bold text-black shadow-[0_0_32px_rgba(0,229,255,0.2)] transition hover:brightness-110 disabled:opacity-45"
                  >
                    {loading
                      ? isSignup
                        ? "Creating account…"
                        : "Signing in…"
                      : isSignup
                        ? "Create account"
                        : "Sign in"}
                  </button>
                </form>
              </>
            ) : error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs leading-snug text-red-100">
                {error}
              </div>
            ) : null}

            <p className="mt-8 text-center text-xs text-white/40">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="font-semibold text-[#00e5ff] hover:text-white"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="font-semibold text-[#00e5ff] hover:text-white"
                  >
                    Create account
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="relative text-[11px] text-white/30">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline-offset-2 hover:text-white/50 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline-offset-2 hover:text-white/50 hover:underline">
              Privacy
            </Link>
            .
          </p>
        </section>

        <LoginShowcase />
      </div>
    </div>
  );
}
