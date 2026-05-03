"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { creditPlans } from "@/lib/stripe/plans";

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(planId: string) {
    setLoadingPlan(planId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId })
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
      <p className="mt-2 text-sm text-zinc-300">Purchase credits with Stripe Checkout.</p>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {creditPlans.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="text-base font-semibold">{p.name}</div>
            <div className="mt-2 text-3xl font-semibold">${p.priceUsd}</div>
            <div className="mt-1 text-sm text-zinc-300">{p.credits} credits</div>
            <div className="mt-6">
              <Button
                className="w-full bg-violet-500 hover:bg-violet-400"
                onClick={() => startCheckout(p.id)}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === p.id ? "Redirecting…" : "Buy credits"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
