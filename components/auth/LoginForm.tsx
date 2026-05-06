/**
 * Reusable sign-in (email + password + Google OAuth). The root landing page
 * no longer embeds this — users go to /login to authenticate.
 */
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";
import { Chrome } from "lucide-react";

import { getPublicSiteUrl } from "@/lib/public-site-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function LoginForm({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
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
    "mt-2 w-full rounded-lg border border-[#333333] bg-[#1a1a1a] px-4 py-3.5 text-[15px] font-normal text-white outline-none placeholder:text-neutral-600 transition-colors focus:border-neutral-500 focus:outline-none";

  return (
    <div className={cn("w-full max-w-[22rem]", className)}>
      <button
        type="button"
        onClick={onGoogleLogin}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#333333] bg-[#1a1a1a] text-sm font-semibold text-white transition-colors hover:border-neutral-500 hover:bg-[#222222] disabled:opacity-45"
      >
        <Chrome className="size-4 text-neutral-300" strokeWidth={1.75} aria-hidden />
        Continue with Google
      </button>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#333333]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">or email</span>
        <div className="h-px flex-1 bg-[#333333]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Email</span>
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Password</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
        <Link href="/signup" className="font-semibold text-white underline-offset-4 transition-colors hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
