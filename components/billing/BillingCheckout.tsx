"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  XCircle
} from "lucide-react";

import { openDodoCustomerPortal } from "@/lib/dodo-payments/open-customer-portal";
import type { BillingSummary } from "@/lib/dodo-payments/billing-summary";
import { useCredits } from "@/lib/hooks/use-credits";
import { cn } from "@/lib/utils";

function formatRenewalDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function statusTone(statusRaw: BillingSummary["statusRaw"], cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd && statusRaw === "active") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  switch (statusRaw) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "on_hold":
    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "cancelled":
    case "expired":
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-200";
    default:
      return "border-white/15 bg-white/[0.04] text-zinc-300";
  }
}

type PortalAction = "manage" | "payment" | "cancel";

const PORTAL_BUTTONS: {
  action: PortalAction;
  label: string;
  description: string;
  icon: typeof CreditCard;
  variant: "primary" | "secondary";
}[] = [
  {
    action: "manage",
    label: "Manage subscription",
    description: "View plan details and invoices in Dodo.",
    icon: ShieldCheck,
    variant: "primary"
  },
  {
    action: "payment",
    label: "Update payment method",
    description: "Change card or billing details securely.",
    icon: CreditCard,
    variant: "secondary"
  },
  {
    action: "cancel",
    label: "Cancel subscription",
    description: "Cancel anytime — credits you already have stay in your balance.",
    icon: XCircle,
    variant: "secondary"
  }
];

export function BillingCheckout({ userEmail }: { userEmail: string | null }) {
  const { credits, isLoading: creditsLoading } = useCredits();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState<PortalAction | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) {
      setSummaryLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const res = await fetch("/api/billing/summary", { credentials: "include" });
        const body = (await res.json().catch(() => ({}))) as BillingSummary & { error?: string };
        if (!res.ok) {
          if (!cancelled) setSummaryError(body.error ?? "Could not load subscription details.");
          return;
        }
        if (!cancelled) setSummary(body);
      } catch {
        if (!cancelled) setSummaryError("Could not load subscription details.");
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const openPortal = useCallback(async (action: PortalAction) => {
    setPortalError(null);
    setPortalBusy(action);
    const result = await openDodoCustomerPortal();
    if (!result.ok) {
      setPortalError(result.error);
      setPortalBusy(null);
    }
  }, []);

  const hasActiveBilling =
    summary?.hasSubscription &&
    summary.statusRaw &&
    !["cancelled", "expired", "failed"].includes(summary.statusRaw);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs font-medium uppercase tracking-wider text-brand-light">Billing</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Subscription &amp; credits
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
        Manage your Zorixa AI plan through Dodo Payments. Credits stack in your balance until you
        use them.
      </p>

      {userEmail ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-zinc-400">
          Signed in as <span className="text-zinc-200">{userEmail}</span>
        </p>
      ) : null}

      {/* Credits balance */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          <Sparkles className="size-3.5 text-brand-light" aria-hidden />
          Credit balance
        </div>
        <p className="mt-2 font-display text-3xl font-bold tabular-nums text-white">
          {creditsLoading ? "…" : credits}
          <span className="ml-2 text-base font-normal text-zinc-500">credits</span>
        </p>
      </section>

      {/* Subscription summary */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-white">Your subscription</h2>

        {summaryLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading subscription…
          </div>
        ) : summaryError ? (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {summaryError}
          </p>
        ) : summary?.hasSubscription ? (
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Current plan
              </dt>
              <dd className="mt-1 text-base font-semibold text-white">{summary.planName}</dd>
              {summary.creditsPerMonth ? (
                <dd className="mt-0.5 text-xs text-zinc-500">
                  {summary.creditsPerMonth.toLocaleString()} credits / month
                </dd>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Subscription status
              </dt>
              <dd className="mt-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    statusTone(summary.statusRaw, summary.cancelAtPeriodEnd)
                  )}
                >
                  {summary.status}
                </span>
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <CalendarClock className="size-3.5" aria-hidden />
                Next renewal
              </dt>
              <dd className="mt-1 text-sm font-medium text-white">
                {summary.cancelAtPeriodEnd && summary.statusRaw === "active"
                  ? `Ends ${formatRenewalDate(summary.nextRenewalDate)}`
                  : formatRenewalDate(summary.nextRenewalDate)}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-5 text-center">
            <p className="text-sm text-zinc-300">No active subscription yet.</p>
            <p className="mt-1 text-xs text-zinc-500">
              Choose a monthly plan to get credits for image, video, and speech generation.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-brand px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-95"
            >
              View plans &amp; subscribe
            </Link>
          </div>
        )}
      </section>

      {/* Portal actions */}
      {hasActiveBilling || summary?.hasSubscription ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white">Manage billing</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Subscription changes are handled securely in the Dodo customer portal.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {PORTAL_BUTTONS.map(({ action, label, description, icon: Icon, variant }) => (
              <button
                key={action}
                type="button"
                onClick={() => void openPortal(action)}
                disabled={portalBusy !== null || !userEmail}
                className={cn(
                  "flex min-h-[52px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                  variant === "primary"
                    ? "bg-gradient-to-r from-violet-600 to-brand text-white shadow-lg shadow-brand/15 hover:opacity-95"
                    : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    variant === "primary" ? "bg-white/15" : "bg-white/10"
                  )}
                >
                  {portalBusy === action ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Icon className="size-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs",
                      variant === "primary" ? "text-white/80" : "text-zinc-500"
                    )}
                  >
                    {description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {portalError ? (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {portalError}
        </p>
      ) : null}

      <p className="mt-8 text-center text-xs leading-relaxed text-zinc-500">
        Payments are processed by Dodo Payments. Your credit balance updates automatically after
        each successful billing period.
      </p>
    </main>
  );
}
