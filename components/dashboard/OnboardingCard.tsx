"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

const STEPS = [
  "Choose a plan",
  "Generate your first image or video",
  "Download and share"
] as const;

export function OnboardingCard({ checkoutHref = "/pricing" }: { checkoutHref?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[#00e5ff]/20 bg-white/[0.05] p-5 shadow-[0_8px_40px_rgba(0,229,255,0.12)] backdrop-blur-xl sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#00e5ff]/10 via-transparent to-violet-600/10" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00e5ff]">Getting started</p>
          <h2 className="mt-2 font-display text-lg font-semibold text-white sm:text-xl">
            Your studio is ready — pick a plan to begin
          </h2>
          <ol className="mt-4 space-y-2.5">
            {STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-2.5 text-sm text-white/70">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#00e5ff]/15 text-[10px] font-bold text-[#00e5ff]">
                  {index + 1}
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[#00e5ff]/70" aria-hidden />
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <Link
          href={checkoutHref}
          onClick={() => trackEvent(AnalyticsEvents.ONBOARDING_CARD_CLICKED, { source: "dashboard" })}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#00e5ff] px-6 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
        >
          View Plans
          <ArrowRight className="ml-2 size-4" aria-hidden />
        </Link>
      </div>
    </motion.section>
  );
}
