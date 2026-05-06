"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Chrome } from "lucide-react";

import { getPublicSiteUrl } from "@/lib/public-site-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

    startTransition(() => {
      router.push(redirectTo);
      router.refresh();
    });
  }

  async function onGoogleLogin() {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getPublicSiteUrl()}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
      }
    });

    setLoading(false);
    if (oauthError) setError(oauthError.message);
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-[15px] font-normal text-white outline-none placeholder:text-neutral-600 transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-white/20";

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,26rem)]">
        {/* Editorial headline */}
        <section className="flex flex-col justify-end px-6 pb-12 pt-10 sm:px-10 sm:pb-16 lg:justify-center lg:px-14 lg:pb-0 xl:px-20">
          <Link
            href="/"
            className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:text-white"
          >
            ← Back
          </Link>
          <h1 className="mt-10 max-w-[14ch] font-display text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.95] tracking-tight text-white lg:mt-16">
            Sign in to
            <br />
            Zorixa AI
          </h1>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-neutral-500">
            Access your studio, credits, and generations.
          </p>
        </section>

        {/* Form column */}
        <aside className="flex items-stretch justify-center border-t border-neutral-800 lg:border-l lg:border-t-0">
          <div className="flex w-full max-w-md flex-col justify-center px-6 py-14 sm:px-10 lg:px-12 lg:py-16">
            <div className="space-y-8">
              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#333333] bg-[#1a1a1a] text-sm font-semibold text-white transition-colors hover:border-neutral-500 hover:bg-[#222222] disabled:opacity-50"
              >
                <Chrome className="size-4 text-neutral-300" strokeWidth={1.75} aria-hidden />
                Continue with Google
              </button>

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-neutral-800" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
                  or email
                </span>
                <div className="h-px flex-1 bg-neutral-800" />
              </div>

              <form onSubmit={onEmailPasswordLogin} className="space-y-5">
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
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
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
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
                  <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-xs text-red-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-full bg-[#2563eb] text-sm font-bold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Sign in
                </button>
              </form>

              <p className="text-center text-xs text-neutral-500">
                Don&apos;t have an account?{" "}
                <Link className="font-semibold text-white underline-offset-4 hover:underline" href="/signup">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
