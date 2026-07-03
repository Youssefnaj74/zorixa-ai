"use client";

import Link from "next/link";

import { fmtUsd2 } from "@/lib/provider-wallets-format";

export type ProviderWalletData = {
  provider: string;
  initialDepositUsd: number;
  totalCostUsd: number;
  estimatedRemainingUsd: number;
  lastUpdated: string | null;
  notes: string | null;
};

function remainingWarningClass(remainingUsd: number): string {
  if (remainingUsd < 5) return "border-red-500/40 bg-red-500/10";
  if (remainingUsd < 10) return "border-amber-500/40 bg-amber-500/10";
  return "border-white/10 bg-white/[0.03]";
}

function remainingTextClass(remainingUsd: number): string {
  if (remainingUsd < 5) return "text-red-300";
  if (remainingUsd < 10) return "text-amber-300";
  return "text-white";
}

export function ProviderWalletCard({
  wallet,
  loading,
  error
}: {
  wallet: ProviderWalletData | null;
  loading?: boolean;
  error?: string | null;
}) {
  if (loading && !wallet) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-white/50">Loading provider wallet…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
        <p className="text-sm text-red-200">{error}</p>
      </section>
    );
  }

  if (!wallet) return null;

  const remaining = wallet.estimatedRemainingUsd;
  const showRedWarning = remaining < 5;
  const showOrangeWarning = remaining < 10 && !showRedWarning;

  return (
    <section className={`rounded-xl border p-5 ${remainingWarningClass(remaining)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-white/90">Provider Wallet</h2>
          <p className="mt-1 text-xs text-white/45">
            Estimated BytePlus Balance — calculated from internal generation_economics data, not the
            BytePlus API.
          </p>
        </div>
        <Link
          href="/dashboard/admin/provider-wallets"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/5"
        >
          Recharge
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/45">BytePlus Initial Deposit</p>
          <p className="mt-1 text-xl font-semibold text-white">{fmtUsd2(wallet.initialDepositUsd)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/45">Total BytePlus Cost</p>
          <p className="mt-1 text-xl font-semibold text-white">{fmtUsd2(wallet.totalCostUsd)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/45">Estimated BytePlus Remaining</p>
          <p className={`mt-1 text-xl font-semibold ${remainingTextClass(remaining)}`}>
            {fmtUsd2(remaining)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/45">Last Updated</p>
          <p className="mt-1 text-sm text-white/70">
            {wallet.lastUpdated ? new Date(wallet.lastUpdated).toLocaleString() : "—"}
          </p>
        </div>
      </div>

      {showRedWarning ? (
        <p className="mt-4 text-sm font-medium text-red-300">Recharge BytePlus soon.</p>
      ) : showOrangeWarning ? (
        <p className="mt-4 text-sm text-amber-300">Balance is running low — consider recharging soon.</p>
      ) : null}
    </section>
  );
}
