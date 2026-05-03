"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Chrome, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
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
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
      }
    });

    setLoading(false);
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <div className="mx-auto flex max-w-md flex-col px-6 py-14">
        <Link href="/" className="text-sm font-medium text-zinc-300 hover:text-white">
          ← Back to home
        </Link>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Sign in to access your dashboard and credits.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <Button
            onClick={onGoogleLogin}
            className="w-full bg-white/10 text-white hover:bg-white/15"
            disabled={loading}
            type="button"
          >
            <Chrome className="mr-2 size-4" />
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-xs text-zinc-400">or</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={onEmailPasswordLogin} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-zinc-300">Email</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-violet-400/50"
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
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-violet-400/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
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
              <Mail className="mr-2 size-4" />
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-xs text-zinc-400">
            Don’t have an account?{" "}
            <Link className="text-zinc-200 hover:text-white" href="/signup">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
