"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { loginRedirectUrl, signupRedirectUrl } from "@/lib/studio-auth-redirect";

export function AuthRequiredModal({
  open,
  onClose,
  returnPath
}: {
  open: boolean;
  onClose: () => void;
  returnPath?: string;
}) {
  if (!open) return null;

  const signInHref = loginRedirectUrl(returnPath);
  const signupHref = signupRedirectUrl(returnPath);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-4 sm:px-6">
      <div
        role="dialog"
        aria-labelledby="auth-required-title"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
      >
        <h3 id="auth-required-title" className="text-lg font-semibold tracking-tight text-white">
          Sign in to generate content
        </h3>
        <p className="mt-2 text-sm text-zinc-300">
          Your session expired or you need an account to run generations. Sign in to continue where you left off.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={signInHref} className="flex-1">
            <Button className="w-full bg-[#00e5ff] font-semibold text-black hover:bg-[#00e5ff]/90">
              Sign In
            </Button>
          </Link>
          <Link href={signupHref} className="flex-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full bg-white/5 text-zinc-200 hover:bg-white/10"
              onClick={onClose}
            >
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
