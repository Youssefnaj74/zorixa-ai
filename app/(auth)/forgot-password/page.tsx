"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { ZorixaLogo } from "@/components/layout/ZorixaLogo";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${getPublicSiteUrl()}/auth/callback?redirect=/reset-password`
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080810] px-6 py-16 text-white">
      <div className="w-full max-w-md">
        <ZorixaLogo href="/" textClassName="text-lg font-semibold" />
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-white/50">
          Enter your account email and we&apos;ll send a secure link to choose a new password.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-5 py-4 text-sm text-emerald-100">
            If an account exists for <span className="font-semibold">{email.trim()}</span>, a reset
            link is on the way. Check your inbox and spam folder.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Email
              </span>
              <input
                className="mt-1.5 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none ring-[#00e5ff]/40 placeholder:text-white/30 focus:ring-2"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-[#00e5ff] text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-45"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-white/40">
          <Link href="/login" className="font-semibold text-[#00e5ff] hover:text-white">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
