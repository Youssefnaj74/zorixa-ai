"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type WelcomeBannerProps = {
  displayName: string | null;
  tagline: string;
};

export function WelcomeBanner({ displayName, tagline }: WelcomeBannerProps) {
  const first = displayName?.trim().split(/\s+/)[0] ?? "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.06] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/4 size-48 rounded-full bg-indigo-500/15 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <motion.span
            className="grid size-14 shrink-0 place-items-center rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/30 to-indigo-600/20 text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.25)]"
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="size-7" aria-hidden />
          </motion.span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">Welcome back</p>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Hi, {first}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">{tagline}</p>
          </div>
        </div>
        <motion.div
          className="hidden h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent sm:block sm:mx-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          style={{ originX: 0 }}
        />
        <p className="text-xs font-medium text-violet-200/50 sm:text-right">Zorixa · Creative studio</p>
      </div>
    </motion.div>
  );
}
