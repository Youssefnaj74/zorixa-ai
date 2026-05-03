"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function GenerateButton({
  loading,
  creditsLabel = "~90.00 CR",
  onClick,
  className,
  disabled
}: {
  loading?: boolean;
  creditsLabel?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.99 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-brand px-4 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-generate-pulse transition-shadow",
        "hover:shadow-glow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
        "disabled:cursor-not-allowed disabled:opacity-60",
        !loading && !disabled && "hover:shadow-[0_0_32px_rgba(131,56,235,0.35)]",
        className
      )}
    >
      {loading ? (
        <span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-50"
          aria-hidden
        />
      ) : null}
      {loading ? (
        <span className="relative inline-flex size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <Sparkles className="relative size-5 shrink-0" strokeWidth={2} />
      )}
      <span className="relative">GENERATE</span>
      <span className="relative ml-auto tabular-nums text-xs font-semibold opacity-90">{creditsLabel}</span>
    </motion.button>
  );
}
