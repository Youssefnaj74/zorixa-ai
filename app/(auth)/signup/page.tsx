"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
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

