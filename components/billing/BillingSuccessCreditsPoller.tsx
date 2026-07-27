"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CREDITS_BEFORE_CHECKOUT_KEY } from "@/lib/dodo-payments/start-checkout";
import { formatInteger } from "@/lib/format-number";

type PollState = "checking" | "pending" | "granted" | "timeout" | "error";

function readBaselineFromSession(): number | null {
  try {
    const raw = sessionStorage.getItem(CREDITS_BEFORE_CHECKOUT_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function BillingSuccessCreditsPoller() {
  const [state, setState] = useState<PollState>("checking");
  const [balance, setBalance] = useState<number | null>(null);
  const baselineRef = useRef<number | null>(readBaselineFromSession());
  const hadCheckoutBaseline = useRef(baselineRef.current !== null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;
    let timer: number | undefined;

    async function tick() {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await fetch("/api/credits", { credentials: "include", cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setState("error");
          return;
        }
        const body = (await res.json()) as {
          credits_balance?: number;
          is_premium?: boolean;
          starter_pass_purchased_at?: string | null;
        };
        const next = typeof body.credits_balance === "number" ? body.credits_balance : 0;
        if (cancelled) return;

        setBalance(next);

        // Webhook often wins the race: credits already applied before this page loads.
        // Without a pre-checkout snapshot, treat a paid/pass profile as confirmed.
        if (!hadCheckoutBaseline.current) {
          const alreadyFulfilled =
            next > 0 &&
            (body.is_premium === true || Boolean(body.starter_pass_purchased_at));
          if (alreadyFulfilled) {
            setState("granted");
            return;
          }
        }

        if (baselineRef.current === null) {
          baselineRef.current = next;
          setState("pending");
        } else if (next > baselineRef.current) {
          setState("granted");
          try {
            sessionStorage.removeItem(CREDITS_BEFORE_CHECKOUT_KEY);
          } catch {
            /* ignore */
          }
          return;
        } else if (attempts >= maxAttempts) {
          setState("timeout");
          return;
        } else {
          setState("pending");
        }

        timer = window.setTimeout(() => void tick(), 3000);
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
      {state === "granted" ? (
        <>
          <p className="text-sm font-semibold text-emerald-300">Credits added</p>
          <p className="mt-1 text-sm text-zinc-300">
            Your balance is now{" "}
            <span className="font-semibold text-white">
              {formatInteger(balance ?? 0)} credits
            </span>
            . You&apos;re ready to generate.
          </p>
        </>
      ) : state === "error" ? (
        <>
          <p className="text-sm font-semibold text-amber-300">Could not confirm credits yet</p>
          <p className="mt-1 text-sm text-zinc-300">
            Payment succeeded, but we couldn&apos;t read your balance. Open the dashboard and refresh
            — or contact support with your Dodo receipt.
          </p>
        </>
      ) : state === "timeout" ? (
        <>
          <p className="text-sm font-semibold text-amber-300">Still waiting on credits</p>
          <p className="mt-1 text-sm text-zinc-300">
            Your payment went through. Credits usually appear within a few minutes. Refresh the
            dashboard, or email billing@zorixaai.com with your Dodo receipt.
            {balance !== null ? ` Current balance: ${formatInteger(balance)}.` : null}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-[#00e5ff]">Confirming your credits…</p>
          <p className="mt-1 text-sm text-zinc-300">
            {balance !== null
              ? `Current balance: ${formatInteger(balance)} credits. Waiting for confirmation…`
              : "Checking your account balance…"}
          </p>
        </>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/dashboard">
          <Button className="bg-white/10 text-white hover:bg-white/15">Go to dashboard</Button>
        </Link>
        <Link href="/video">
          <Button variant="ghost" className="text-zinc-300">
            Open video studio
          </Button>
        </Link>
      </div>
    </div>
  );
}
