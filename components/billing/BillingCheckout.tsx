"use client";

import { useEffect } from "react";
import { Check, Sparkles, Zap } from "lucide-react";

import { useCredits } from "@/lib/hooks/use-credits";

type Props = {
  checkoutUrl: string | null;
  creditsAmount: number;
  userEmail: string | null;
};

const benefits = [
  { icon: Sparkles, text: "Applies to image enhancement and UGC video generation" },
  { icon: Zap, text: "Credits land in your account right after payment" },
  { icon: Check, text: "Keep creating — top up anytime from this page" }
];

export function BillingCheckout({ checkoutUrl, creditsAmount, userEmail }: Props) {
  const { credits, isLoading: creditsLoading } = useCredits();

  useEffect(() => {
    window.createLemonSqueezy?.();
  }, [checkoutUrl]);

  const configured = checkoutUrl !== null;

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12 lg:max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-wider text-brand-light">Lemon Squeezy</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Unlock {creditsAmount} credits
      </h1>
      <div className="mt-4 flex flex-wrap items-baseline gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Current balance</span>
        <span className="font-display text-2xl font-bold tabular-nums text-white">
          {creditsLoading ? "…" : credits}
        </span>
        <span className="text-sm text-zinc-500">credits (synced from Supabase)</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
        One pack for Zorixa AI — credits for image enhancement and UGC video when you need them.
      </p>
      {userEmail ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-zinc-400">
          Signed in as <span className="text-zinc-200">{userEmail}</span>
        </p>
      ) : null}

      <ul className="mt-8 space-y-4">
        {benefits.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3 text-sm text-zinc-200">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-light ring-1 ring-brand/25">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="leading-relaxed">{text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        {configured ? (
          <a
            href={checkoutUrl}
            className="lemonsqueezy-button inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-brand px-8 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Buy credits
          </a>
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Add{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">
              NEXT_PUBLIC_LEMON_SQUEEZY_STORE_SLUG
            </code>{" "}
            and{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">
              NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID
            </code>{" "}
            to enable checkout.
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-zinc-500">
        Secure checkout overlay by Lemon Squeezy. Your balance updates automatically after payment.
      </p>
    </main>
  );
}
