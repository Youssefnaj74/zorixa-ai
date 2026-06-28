"use client";

import { useCallback, useEffect, useState } from "react";

type Summary = {
  totalGenerations: number;
  successCount: number;
  failedCount: number;
  fallbackCount: number;
  revenueUsd: number;
  providerCostUsd: number;
  grossProfitUsd: number;
  profitMarginPct: number;
  byteplusUsagePct: number;
  atlasUsagePct: number;
  costByProvider: { byteplus: number; atlas: number };
};

type LogRow = {
  id: number;
  created_at: string;
  model_label: string;
  workflow: string;
  provider_used: string;
  provider_attempted: string | null;
  fallback_used: boolean;
  generation_status: string;
  credits_charged: number;
  revenue_usd: number;
  provider_cost_usd: number;
  gross_profit_usd: number;
  profit_margin_pct: number;
  resolution: string | null;
  duration_sec: number | null;
  generate_audio: boolean | null;
};

type AuditAnswer = {
  question: string;
  answer: "yes" | "partial" | "no";
  detail: string;
};

type DashboardPayload = {
  day: string;
  summary: Summary;
  topWorkflows: { workflow: string; count: number }[];
  topModels: { model: string; count: number }[];
  latestLogs: LogRow[];
  productionAudit: AuditAnswer[];
};

function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-white/40">{sub}</p> : null}
    </div>
  );
}

function auditBadge(answer: AuditAnswer["answer"]): string {
  if (answer === "yes") return "bg-emerald-500/20 text-emerald-300";
  if (answer === "partial") return "bg-amber-500/20 text-amber-300";
  return "bg-red-500/20 text-red-300";
}

export function AdminProfitabilityDashboard() {
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/generation-economics?day=${encodeURIComponent(day)}`, {
        cache: "no-store"
      });
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
      setData((await res.json()) as DashboardPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void load();
  }, [load]);

  const s = data?.summary;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Profitability & Provider Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">
            Credits unchanged — revenue from existing pricing; cost from real provider (BytePlus or Atlas).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Refresh
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <p className="text-white/50">Loading…</p>
      ) : null}

      {s ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Generations today" value={String(s.totalGenerations)} />
            <StatCard label="Revenue" value={fmtUsd(s.revenueUsd)} sub="credits × $0.01" />
            <StatCard label="Provider cost" value={fmtUsd(s.providerCostUsd)} />
            <StatCard
              label="Gross profit"
              value={fmtUsd(s.grossProfitUsd)}
              sub={`Margin ${fmtPct(s.profitMarginPct)}`}
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="BytePlus usage"
              value={fmtPct(s.byteplusUsagePct)}
              sub={`Cost ${fmtUsd(s.costByProvider.byteplus)}`}
            />
            <StatCard
              label="Atlas usage"
              value={fmtPct(s.atlasUsagePct)}
              sub={`Cost ${fmtUsd(s.costByProvider.atlas)}`}
            />
            <StatCard label="Fallbacks" value={String(s.fallbackCount)} sub="BytePlus → Atlas" />
            <StatCard
              label="Success / Failed"
              value={`${s.successCount} / ${s.failedCount}`}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h2 className="text-sm font-medium text-white/80">Top workflows</h2>
              <ul className="mt-3 space-y-2">
                {(data?.topWorkflows ?? []).map((w) => (
                  <li key={w.workflow} className="flex justify-between text-sm text-white/70">
                    <span>{w.workflow}</span>
                    <span>{w.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h2 className="text-sm font-medium text-white/80">Top models</h2>
              <ul className="mt-3 space-y-2">
                {(data?.topModels ?? []).map((m) => (
                  <li key={m.model} className="flex justify-between text-sm text-white/70">
                    <span>{m.model}</span>
                    <span>{m.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 overflow-hidden">
            <h2 className="border-b border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/80">
              Latest generation logs
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-white/70">
                <thead className="bg-white/[0.02] text-white/45">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Model</th>
                    <th className="px-3 py-2">Workflow</th>
                    <th className="px-3 py-2">Provider</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">CR</th>
                    <th className="px-3 py-2">Rev</th>
                    <th className="px-3 py-2">Cost</th>
                    <th className="px-3 py-2">Profit</th>
                    <th className="px-3 py-2">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.latestLogs ?? []).map((row) => (
                    <tr key={row.id} className="border-t border-white/5">
                      <td className="whitespace-nowrap px-3 py-2">
                        {new Date(row.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2">{row.model_label}</td>
                      <td className="px-3 py-2">{row.workflow}</td>
                      <td className="px-3 py-2">
                        {row.provider_used}
                        {row.fallback_used ? " (fb)" : ""}
                      </td>
                      <td className="px-3 py-2">{row.generation_status}</td>
                      <td className="px-3 py-2">{row.credits_charged}</td>
                      <td className="px-3 py-2">{fmtUsd(Number(row.revenue_usd))}</td>
                      <td className="px-3 py-2">{fmtUsd(Number(row.provider_cost_usd))}</td>
                      <td className="px-3 py-2">{fmtUsd(Number(row.gross_profit_usd))}</td>
                      <td className="px-3 py-2">{fmtPct(Number(row.profit_margin_pct))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 p-4">
            <h2 className="text-sm font-medium text-white/80">BytePlus feature mapping</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs text-white/65">
                <thead>
                  <tr className="text-white/40">
                    <th className="px-2 py-1">Option</th>
                    <th className="px-2 py-1">Value</th>
                    <th className="px-2 py-1">Level</th>
                    <th className="px-2 py-1">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    data as DashboardPayload & {
                      featureAudit?: {
                        option: string;
                        value: string;
                        level: string;
                        notes: string;
                      }[];
                    }
                  )?.featureAudit?.map((row) => (
                    <tr key={`${row.option}-${row.value}`} className="border-t border-white/5">
                      <td className="px-2 py-1">{row.option}</td>
                      <td className="px-2 py-1">{row.value}</td>
                      <td className="px-2 py-1">{row.level}</td>
                      <td className="max-w-md px-2 py-1">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 p-4">
            <h2 className="text-sm font-medium text-white/80">Production audit report</h2>
            <ul className="mt-4 space-y-4">
              {(data?.productionAudit ?? []).map((a) => (
                <li key={a.question} className="border-b border-white/5 pb-4 last:border-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium uppercase ${auditBadge(a.answer)}`}
                    >
                      {a.answer}
                    </span>
                    <span className="text-sm font-medium text-white/90">{a.question}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/55">{a.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
