"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function UpgradeModal({
  open,
  onClose,
  message
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold tracking-tight">Not enough credits</h3>
        <p className="mt-2 text-sm text-zinc-300">
          {message ?? "Upgrade your plan to keep enhancing and generating."}
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard/billing" className="flex-1">
            <Button className="w-full bg-violet-500 hover:bg-violet-400">
              Upgrade credits
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="flex-1 bg-white/5 text-zinc-200 hover:bg-white/10"
            onClick={onClose}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}

