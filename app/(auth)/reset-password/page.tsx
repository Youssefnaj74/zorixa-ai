"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { ZorixaLogo } from "@/components/layout/ZorixaLogo";
import { useScheduledAppRouterNavigation } from "@/lib/hooks/use-scheduled-app-router-navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const scheduleNavigation = useScheduledAppRouterNavigation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Reset link expired or invalid. Request a new one.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      scheduleNavigation("/dashboard", { refresh: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080810] px-6 py-16 text-white">
      <div className="w-full max-w-md">
        <ZorixaLogo href="/" textClassName="text-lg font-semibold" />
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight">Choose a new password</h1>
        <p className="mt-2 text-sm text-white/50">
          You&apos;re signed in via the reset link. Set a new password for your ZorixaAI account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              New password
            </span>
            <input
              className="mt-1.5 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none ring-[#00e5ff]/40 placeholder:text-white/30 focus:ring-2"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Confirm password
            </span>
            <input
              className="mt-1.5 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none ring-[#00e5ff]/40 placeholder:text-white/30 focus:ring-2"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
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
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-white/40">
          Link expired?{" "}
          <Link href="/forgot-password" className="font-semibold text-[#00e5ff] hover:text-white">
            Request a new reset
          </Link>
        </p>
      </div>
    </main>
  );
}
