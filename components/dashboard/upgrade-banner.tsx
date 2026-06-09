"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function UpgradeBanner({ checkoutHref = "/pricing" }: { checkoutHref?: string }) {
  const ctaClass =
    "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-generate-pulse hover:opacity-95";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-violet-400/25 bg-white/[0.06] p-5 shadow-[0_8px_40px_rgba(139,92,246,0.15)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/10 to-transparent" />
      <div className="relative flex gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/20">
          <Sparkles className="size-6 text-violet-200" aria-hidden />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-white">Unlock premium features</p>
          <p className="mt-1 max-w-xl text-sm text-white/55">
            Subscribe for monthly credits — image, video, speech, and priority processing on Zorixa AI.
          </p>
        </div>
      </div>
      <div className="relative shrink-0">
        <Link href={checkoutHref} className={ctaClass}>
          View plans
        </Link>
      </div>
    </motion.div>
  );
}
