"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

export function InsufficientCreditsModal({
  open,
  required,
  balance,
  onClose
}: {
  open: boolean;
  required: number;
  balance: number;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-4 sm:px-6">
      <div
        role="dialog"
        aria-labelledby="insufficient-credits-title"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
      >
        <h3 id="insufficient-credits-title" className="text-lg font-semibold tracking-tight text-white">
          Not enough credits
        </h3>
        <div className="mt-3 space-y-1 text-sm text-zinc-300">
          <p>
            Required: <span className="font-semibold tabular-nums text-white">{required}</span> credits
          </p>
          <p>
            Current balance: <span className="font-semibold tabular-nums text-white">{balance}</span> credits
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/pricing"
            className="flex-1"
            onClick={() => trackEvent("pricing_viewed", { source: "insufficient_credits_modal" })}
          >
            <Button className="w-full bg-[#00e5ff] font-semibold text-black hover:bg-[#00e5ff]/90">
              View Plans
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="flex-1 bg-white/5 text-zinc-200 hover:bg-white/10"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
