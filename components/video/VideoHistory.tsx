"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type VideoHistoryEntry = {
  id: string;
  thumb: string;
  title: string;
  subtitle?: string;
};

export function VideoHistory({
  items,
  onSelect,
  scrollPaddingBottom = 0,
  className
}: {
  items: VideoHistoryEntry[];
  onSelect?: (item: VideoHistoryEntry) => void;
  /** Extra padding at end of scroll (e.g. clear fixed composer). */
  scrollPaddingBottom?: number;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full max-w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[rgba(131,56,235,0.15)] bg-zorixa-bg font-body shadow-glow",
        className
      )}
    >
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs text-zorixa-muted">Recent outputs from this session:</p>
      </div>
      <div
        className="studio-scrollbar flex-1 space-y-3 overflow-y-auto p-4"
        style={scrollPaddingBottom > 0 ? { paddingBottom: scrollPaddingBottom } : undefined}
      >
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onSelect?.(item)}
            className="zorixa-card-border flex w-full gap-3 rounded-xl bg-zorixa-card p-3 text-left transition-shadow hover:shadow-[0_0_20px_rgba(131,56,235,0.2)]"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
              <Image src={item.thumb} alt="" width={64} height={64} className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{item.title}</p>
              <p className="mt-0.5 text-xs text-zorixa-muted">{item.subtitle ?? "Tap to restore settings"}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </aside>
  );
}
