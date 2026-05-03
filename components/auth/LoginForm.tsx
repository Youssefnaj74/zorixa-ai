"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
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

  return (
    <form
      onSubmit={onSubmit}
      className={cn("w-full max-w-md space-y-4 rounded-2xl zorixa-card-border bg-zorixa-card/90 p-6 shadow-glow-lg backdrop-blur", className)}
    >
      <div className="mb-2 flex items-center justify-center gap-2">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-brand/20 ring-1 ring-brand/30">
          <Sparkles className="size-5 text-brand-light" />
        </span>
      </div>
      <p className="text-center text-sm text-zorixa-muted">Sign in to open the Zorixa AI studio.</p>

      <label className="block">
        <span className="text-xs font-medium text-zorixa-muted">Email</span>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-zorixa-bg px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-zorixa-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/30"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-zorixa-muted">Password</span>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-zorixa-bg px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-zorixa-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/30"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>
      ) : null}

      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-xl bg-gradient-brand text-base font-semibold shadow-generate-pulse hover:opacity-95"
      >
        {loading ? "Signing in…" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-zorixa-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-brand-light hover:text-white">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
