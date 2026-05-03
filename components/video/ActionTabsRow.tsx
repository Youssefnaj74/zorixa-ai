"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const TABS = ["Text to Video", "Image to Video", "Lipsyncing", "Video Edit"] as const;

export type ActionTab = (typeof TABS)[number];

export function ActionTabsRow({
  active,
  onChange,
  className
}: {
  active: ActionTab;
  onChange: (t: ActionTab) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid h-full min-h-0 w-full shrink-0 grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#0d0d14] p-1 sm:grid-cols-4",
        className
      )}
    >
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={cn(
              "relative z-10 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm",
              isActive ? "text-white" : "text-zorixa-muted hover:text-white"
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="video-studio-tab-pill"
                className="absolute inset-0 z-[-1] rounded-lg bg-zorixa-tab shadow-[0_0_16px_rgba(37,99,235,0.35)]"
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            ) : null}
            <span className="relative block truncate">{tab}</span>
          </button>
        );
      })}
    </div>
  );
}
