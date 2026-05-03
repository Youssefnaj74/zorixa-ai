"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

export type HistoryItem = {
  id: string;
  thumb: string;
  label: string;
};

export function HistoryPanel({
  items,
  className
}: {
  items: HistoryItem[];
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "zorixa-card-border flex w-full max-w-[280px] shrink-0 flex-col rounded-2xl bg-zorixa-card shadow-glow transition-shadow hover:shadow-glow-lg",
        className
      )}
    >
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-white">Generation history</h3>
        <p className="mt-1 text-xs text-zorixa-muted">Recent outputs from this session.</p>
      </div>
      <div className="studio-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {items.length === 0 ? (
          <p className="text-center text-xs text-zorixa-muted">No generations yet.</p>
        ) : (
          items.map((it) => (
            <button
              key={it.id}
              type="button"
              className="zorixa-card-border group flex w-full gap-3 rounded-xl bg-zorixa-bg-secondary p-2 text-left transition-shadow hover:shadow-glow"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                <Image src={it.thumb} alt="" width={56} height={56} className="size-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">{it.label}</p>
                <p className="text-[10px] text-zorixa-muted">Tap to restore settings</p>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

export function LipsyncStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "zorixa-card-border flex w-12 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl bg-zorixa-card py-6 shadow-glow",
        className
      )}
    >
      <span
        className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-zorixa-muted [writing-mode:vertical-rl] rotate-180"
        style={{ textOrientation: "mixed" }}
      >
        Lipsyncing
      </span>
      <span className="size-2 rounded-full bg-brand/50 ring-2 ring-brand/30" aria-hidden />
    </div>
  );
}
