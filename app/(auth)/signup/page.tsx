"use client";

import Link from "next/link";
import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useScheduledAppRouterNavigation } from "@/lib/hooks/use-scheduled-app-router-navigation";

export default function SignupPage() {
  const scheduleNavigation = useScheduledAppRouterNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogleSignup() {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (oauthError) {
      setLoading(false);
      setError(oauthError.message);
    }
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    scheduleNavigation("/dashboard", { refresh: true });
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <div className="mx-auto flex max-w-md flex-col px-6 py-14">
        <Link href="/" className="text-sm font-medium text-zinc-300 hover:text-white">
          ← Back to home
        </Link>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-zinc-300">You’ll start with free credits.</p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <button
            type="button"
            onClick={onGoogleSignup}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-transparent px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
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

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              OR CONTINUE WITH
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={onSignup} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-zinc-300">Full name</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/50"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-300">Email</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/50"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-300">Password</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/50"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-violet-500 hover:bg-violet-400 focus-visible:ring-violet-300"
              disabled={loading}
            >
              <UserPlus className="mr-2 size-4" />
              Create account
            </Button>
          </form>

          <p className="mt-5 text-xs text-zinc-400">
            Already have an account?{" "}
            <Link className="text-zinc-200 hover:text-white" href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

