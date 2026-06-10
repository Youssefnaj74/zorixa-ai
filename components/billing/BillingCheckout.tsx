"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CreditCard, Loader2, Sparkles, Zap } from "lucide-react";
import { useCredits } from "@/lib/hooks/use-credits";

const benefits = [
  { icon: Sparkles, text: "Monthly credits for image, video, and speech generation" },
  { icon: Zap, text: "Credits land in your account after payment (via webhook)" },
  { icon: Check, text: "Choose Starter, Pro, Creator, or Ultra on the pricing page" }
];

export function BillingCheckout({ userEmail }: { userEmail: string | null }) {
  const { credits, isLoading: creditsLoading } = useCredits();
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  async function openCustomerPortal() {
    setPortalError(null);
    setPortalBusy(true);
    try {
      const res = await fetch("/api/billing/customer-portal", {
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && body.url) {
        window.location.href = body.url;
        return;
      }
      setPortalError(body.error ?? "Could not open billing portal.");
      setPortalBusy(false);
    } catch {
      setPortalError("Could not open billing portal. Try again shortly.");
      setPortalBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12 lg:max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-wider text-brand-light">Dodo Payments</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Subscribe for credits
      </h1>
      <div className="mt-4 flex flex-wrap items-baseline gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Current balance</span>
        <span className="font-display text-2xl font-bold tabular-nums text-white">
          {creditsLoading ? "…" : credits}
        </span>
        <span className="text-sm text-zinc-500">credits</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
        Zorixa AI subscriptions are billed monthly through Dodo Payments. Pick a plan that matches your
        studio usage.
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

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Link
          href="/pricing"
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-brand px-8 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-95"
        >
          View plans &amp; subscribe
        </Link>
        <button
          type="button"
          onClick={() => void openCustomerPortal()}
          disabled={portalBusy || !userEmail}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-8 py-3.5 text-center text-base font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {portalBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CreditCard className="size-4" aria-hidden />}
          Manage subscription
        </button>
      </div>

      {portalError ? (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {portalError}
        </p>
      ) : null}

      <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500">
        Manage subscription opens the Dodo customer portal — update your payment method, view invoices, or
        cancel anytime.
      </p>
      <p className="mt-2 text-center text-xs text-zinc-500">
        Secure checkout by Dodo Payments. Your balance updates automatically after payment.
      </p>
    </main>
  );
}
