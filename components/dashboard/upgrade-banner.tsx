"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

export function UpgradeBanner({ checkoutHref }: { checkoutHref: string }) {
  const isLemonOverlay = checkoutHref.includes("lemonsqueezy.com");

  useEffect(() => {
    if (isLemonOverlay) window.createLemonSqueezy?.();
  }, [checkoutHref, isLemonOverlay]);

  const ctaClass =
    "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-generate-pulse hover:opacity-95";

  return (
    <div className="zorixa-card-border flex flex-col gap-4 rounded-2xl border border-brand/30 bg-gradient-to-r from-brand/20 via-brand/10 to-transparent p-5 shadow-glow sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/25 ring-1 ring-brand/40">
          <Sparkles className="size-6 text-brand-light" aria-hidden />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-white">Unlock premium features</p>
          <p className="mt-1 max-w-xl text-sm text-zorixa-muted">
            Get full access to image enhancement, UGC video generation, and priority processing with Zorixa AI.
          </p>
        </div>
      </div>
      {isLemonOverlay ? (
        <a href={checkoutHref} className={`lemonsqueezy-button ${ctaClass}`}>
          Upgrade now
        </a>
      ) : (
        <Link href={checkoutHref} className={ctaClass}>
          Upgrade now
        </Link>
      )}
    </div>
  );
}
