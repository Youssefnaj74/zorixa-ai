"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fmtUsd2 } from "@/lib/provider-wallets-format";

import type { ProviderWalletData } from "./ProviderWalletCard";

type RechargeRecord = {
  id: number;
  date: string;
  amountUsd: number;
  provider: string;
  notes: string | null;
};

type WalletPayload = {
  wallet: ProviderWalletData;
  recharges: RechargeRecord[];
};

export function ProviderWalletRechargePanel() {
  const [data, setData] = useState<WalletPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeNotes, setRechargeNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/provider-wallets?provider=byteplus", { cache: "no-store" });
      if (res.status === 403) {
        setError("Access denied. Add your email to ZORIXA_ADMIN_EMAILS.");
        setData(null);
        return;
      }
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setError(j.error ?? `Failed (${res.status})`);
        setData(null);
        return;
      }
      setData((await res.json()) as WalletPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const currentDeposit = data?.wallet.initialDepositUsd ?? 0;
  const parsedRecharge = Number(rechargeAmount);
  const rechargeValid = Number.isFinite(parsedRecharge) && parsedRecharge > 0;
  const previewBalance = useMemo(
    () => (rechargeValid ? currentDeposit + parsedRecharge : currentDeposit),
    [currentDeposit, parsedRecharge, rechargeValid]
  );

  async function handleRecharge(e: React.FormEvent) {
    e.preventDefault();
    if (!rechargeValid) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch("/api/admin/provider-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "byteplus",
          amountUsd: parsedRecharge,
          notes: rechargeNotes.trim() || undefined
        })
      });

      const j = (await res.json()) as { error?: string; newBalanceUsd?: number };
      if (!res.ok) {
        setSubmitError(j.error ?? `Failed (${res.status})`);
        return;
      }

      setSubmitSuccess(`Deposit updated to ${fmtUsd2(j.newBalanceUsd ?? previewBalance)}.`);
      setRechargeAmount("");
      setRechargeNotes("");
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Recharge failed");
    } finally {
      setSubmitting(false);
    }
  }

  const wallet = data?.wallet;
  const remaining = wallet?.estimatedRemainingUsd ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <Link href="/dashboard/admin" className="text-xs text-violet-300 hover:text-violet-200">
          ← Back to profitability dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-white">BytePlus Wallet Recharge</h1>
        <p className="text-sm text-white/50">
          Add to the prepaid deposit when you recharge BytePlus. Amounts are added to the current
          balance — previous deposits are never overwritten.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !data ? <p className="text-white/50">Loading…</p> : null}

      {wallet ? (
        <>
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/80">Estimated BytePlus Balance</h2>
            <p className="mt-1 text-xs text-white/45">
              Based on internal generation_economics provider costs (BytePlus only; Atlas excluded).
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/45">Current deposit</p>
                <p className="mt-1 text-xl font-semibold text-white">{fmtUsd2(wallet.initialDepositUsd)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/45">Total BytePlus cost</p>
                <p className="mt-1 text-xl font-semibold text-white">{fmtUsd2(wallet.totalCostUsd)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/45">Estimated remaining</p>
                <p
                  className={`mt-1 text-xl font-semibold ${
                    remaining < 5 ? "text-red-300" : remaining < 10 ? "text-amber-300" : "text-white"
                  }`}
                >
                  {fmtUsd2(remaining)}
                </p>
              </div>
            </div>
            {remaining < 5 ? (
              <p className="mt-4 text-sm font-medium text-red-300">Recharge BytePlus soon.</p>
            ) : null}
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-sm font-medium text-white/80">Record a recharge</h2>
            <form onSubmit={(e) => void handleRecharge(e)} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  <span className="mb-1 block text-xs uppercase tracking-wide text-white/45">
                    Current deposit
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={fmtUsd2(currentDeposit)}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  <span className="mb-1 block text-xs uppercase tracking-wide text-white/45">
                    New recharge (+)
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="50.00"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
                  />
                </label>
              </div>

              {rechargeValid ? (
                <p className="text-sm text-white/60">
                  New balance becomes:{" "}
                  <span className="font-medium text-emerald-300">{fmtUsd2(previewBalance)}</span>
                </p>
              ) : null}

              <label className="block text-sm text-white/70">
                <span className="mb-1 block text-xs uppercase tracking-wide text-white/45">Notes (optional)</span>
                <input
                  type="text"
                  value={rechargeNotes}
                  onChange={(e) => setRechargeNotes(e.target.value)}
                  placeholder="e.g. March prepaid top-up"
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </label>

              {submitError ? <p className="text-sm text-red-300">{submitError}</p> : null}
              {submitSuccess ? <p className="text-sm text-emerald-300">{submitSuccess}</p> : null}

              <button
                type="submit"
                disabled={!rechargeValid || submitting}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Add recharge"}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-white/10 overflow-hidden">
            <h2 className="border-b border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/80">
              Recharge history
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-white/70">
                <thead className="bg-white/[0.02] text-white/45">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Provider</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recharges ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-white/40">
                        No recharges recorded yet.
                      </td>
                    </tr>
                  ) : (
                    (data?.recharges ?? []).map((row) => (
                      <tr key={row.id} className="border-t border-white/5">
                        <td className="whitespace-nowrap px-3 py-2">
                          {new Date(row.date).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{fmtUsd2(row.amountUsd)}</td>
                        <td className="px-3 py-2">{row.provider}</td>
                        <td className="px-3 py-2">{row.notes ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
