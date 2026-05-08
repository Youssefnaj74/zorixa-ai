"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useScheduledAppRouterNavigation } from "@/lib/hooks/use-scheduled-app-router-navigation";

export function LoginForm() {
  const searchParams = useSearchParams();
  const scheduleNavigation = useScheduledAppRouterNavigation();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);

  async function onEmailPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    scheduleNavigation(redirectTo, { refresh: true });
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-[#333333] bg-[#1a1a1a] px-4 py-3.5 text-[15px] font-normal text-white outline-none placeholder:text-neutral-600 transition-colors focus:border-neutral-500 focus:outline-none";

  return (
    <div className="min-h-dvh bg-black text-white antialiased">
      <div className="grid min-h-dvh lg:grid-cols-2">
        <section className="flex flex-col justify-end px-6 pb-16 pt-12 sm:px-12 sm:pb-20 lg:justify-center lg:px-16 lg:pb-0 xl:px-24">
          <Link
            href="/"
            className="w-fit text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500 transition-colors hover:text-white"
          >
            ← Back
          </Link>
          <h1 className="mt-14 max-w-[12ch] font-sans text-[clamp(2.75rem,7vw,5rem)] font-black leading-[0.92] tracking-[-0.03em] text-white lg:mt-20">
            Sign in to
            <br />
            Zorixa AI
          </h1>
          <p className="mt-10 max-w-md text-sm font-normal leading-relaxed text-neutral-500">
            Studio access, credits, and your generations.
          </p>
        </section>

        <aside className="flex items-center justify-center border-t border-[#1a1a1a] lg:border-l lg:border-t-0">
          <div className="flex w-full max-w-[22rem] flex-col justify-center px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
            <form onSubmit={onEmailPasswordLogin} className="space-y-6">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
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
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Password
                </span>
                <input
                  className={inputClass}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-lg border border-red-900/50 bg-red-950/25 px-4 py-3 text-xs font-normal leading-snug text-red-100/95">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-[#2563eb] text-xs font-bold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 disabled:opacity-45"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-10 text-center text-xs font-normal text-neutral-500">
              Don&apos;t have an account?{" "}
              <Link
                className="font-semibold text-white underline-offset-4 transition-colors hover:underline"
                href="/signup"
              >
                Sign up
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
