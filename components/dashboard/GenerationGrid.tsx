"use client";

import { motion } from "framer-motion";
import { Clapperboard } from "lucide-react";

import { ExternalImage } from "@/components/ui/ExternalImage";
import { cn } from "@/lib/utils";

type GenerationTile = {
  id: string;
  /** Remote or absolute path; omit when kind is video and no poster */
  src?: string;
  /** Direct .mp4 / .webm URL for inline playback */
  videoSrc?: string;
  title: string;
  kind?: "image" | "video";
  categoryLabel?: string;
};

export function GenerationGrid({ items, className }: { items: GenerationTile[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item, i) => {
        const showVideo = Boolean(item.videoSrc);
        const showVideoFallback = item.kind === "video" && !item.src && !showVideo;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className="zorixa-card-border group overflow-hidden rounded-2xl bg-zorixa-card shadow-glow transition-shadow hover:shadow-glow-lg"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
              {showVideo ? (
                <video
                  src={item.videoSrc}
                  controls
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 size-full object-cover"
                />
              ) : showVideoFallback ? (
                <div className="flex size-full flex-col items-center justify-center gap-2 text-zorixa-muted">
                  <Clapperboard className="size-12 opacity-60" aria-hidden />
                  <span className="text-xs font-medium">Video</span>
                </div>
              ) : item.src ? (
                <ExternalImage
                  src={item.src}
                  alt={item.title}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="grid size-full place-items-center text-sm text-zorixa-muted">No preview</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4">
                <p className="truncate font-medium text-white">{item.title}</p>
                <p className="text-xs text-white/60">
                  {item.categoryLabel ?? (item.kind === "video" ? "UGC video" : "AI image")} · Zorixa AI
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
