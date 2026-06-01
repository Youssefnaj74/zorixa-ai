"use client";

import { useMemo, useState } from "react";
import { Clapperboard, ImageIcon, LayoutGrid, Mic } from "lucide-react";

import { GenerationGrid } from "@/components/dashboard/GenerationGrid";
import type { GenerationTile } from "@/lib/generation-tile";
import { cn } from "@/lib/utils";

type HistoryKindFilter = "all" | "image" | "video" | "audio";

function resolveTileKind(item: GenerationTile): "image" | "video" | "audio" {
  if (item.kind === "audio" || item.audioSrc) return "audio";
  if (item.kind === "video" || item.videoSrc) return "video";
  return "image";
}

const FILTER_TABS: {
  id: HistoryKindFilter;
  label: string;
  icon: typeof ImageIcon;
}[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Clapperboard },
  { id: "audio", label: "Audio", icon: Mic }
];

export function HistoryFilteredGrid({ items }: { items: GenerationTile[] }) {
  const [filter, setFilter] = useState<HistoryKindFilter>("all");

  const counts = useMemo(() => {
    let image = 0;
    let video = 0;
    let audio = 0;
    for (const item of items) {
      const kind = resolveTileKind(item);
      if (kind === "audio") audio += 1;
      else if (kind === "video") video += 1;
      else image += 1;
    }
    return { all: items.length, image, video, audio };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => resolveTileKind(item) === filter);
  }, [filter, items]);

  const emptyLabel =
    filter === "image"
      ? "No images yet."
      : filter === "video"
        ? "No videos yet."
        : filter === "audio"
          ? "No speech outputs yet."
          : "No generations yet.";

  return (
    <>
      <div
        className="mb-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter history by type"
      >
        {FILTER_TABS.map(({ id, label, icon: Icon }) => {
          const active = filter === id;
          const count = counts[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-[#00e5ff]/50 bg-[#00e5ff]/15 text-white shadow-[0_0_20px_rgba(0,229,255,0.12)]"
                  : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:text-white"
              )}
            >
              <Icon className={cn("size-4", active ? "text-[#00e5ff]" : "text-white/45")} />
              {label}
              <span
                className={cn(
                  "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums",
                  active ? "bg-[#00e5ff]/20 text-[#00e5ff]" : "bg-white/10 text-white/45"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] px-6 py-14 text-center text-sm text-white/35">
          {emptyLabel}
        </div>
      ) : (
        <GenerationGrid items={filteredItems} />
      )}
    </>
  );
}
