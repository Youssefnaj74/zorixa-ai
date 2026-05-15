"use client";

import { useCallback, useEffect, useMemo, useState, type VideoHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clapperboard, Play, X } from "lucide-react";

import { ExternalImage } from "@/components/ui/ExternalImage";
import { normalizeAtlasVideoUrlForPlayback } from "@/lib/resolve-video-playback-url";
import { buildSameOriginVideoPlaybackUrl } from "@/lib/video-playback-proxy";
import { cn } from "@/lib/utils";

export type GenerationTile = {
  id: string;
  /** Poster / image preview */
  src?: string;
  /** Raw CDN video URL */
  videoSrc?: string;
  title: string;
  kind?: "image" | "video";
  categoryLabel?: string;
};

const domVideoAttrs = {
  referrerPolicy: "no-referrer"
} as unknown as VideoHTMLAttributes<HTMLVideoElement>;

function useProxiedVideoPlaybackUrl(raw: string | undefined): string | null {
  return useMemo(() => {
    if (!raw?.trim()) return null;
    const normalized = normalizeAtlasVideoUrlForPlayback(raw);
    if (typeof window === "undefined") return normalized;
    return buildSameOriginVideoPlaybackUrl(normalized, window.location.origin);
  }, [raw]);
}

function HistoryLightbox({
  item,
  onClose
}: {
  item: GenerationTile;
  onClose: () => void;
}) {
  const isVideo = Boolean(item.videoSrc);
  const playbackUrl = useProxiedVideoPlaybackUrl(item.videoSrc);
  const openUrl = item.videoSrc ?? item.src;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const category =
    item.categoryLabel ?? (item.kind === "video" ? "UGC video" : "AI image");

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 right-0 z-10 grid size-10 place-items-center rounded-full border border-white/15 bg-black/60 text-white hover:bg-white/10 sm:-right-2 sm:top-0"
          aria-label="Close preview"
        >
          <X className="size-5" />
        </button>

        <motion.div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80">
          {isVideo && playbackUrl ? (
            <video
              key={playbackUrl}
              src={playbackUrl}
              controls
              playsInline
              preload="auto"
              {...domVideoAttrs}
              className="max-h-[78vh] w-full object-contain"
            />
          ) : item.src ? (
            <ExternalImage
              src={item.src}
              alt={item.title}
              className="max-h-[78vh] w-auto max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-8 py-16 text-zorixa-muted">
              <Clapperboard className="size-16 opacity-50" aria-hidden />
              <p className="text-sm">No preview available</p>
            </div>
          )}
        </motion.div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{item.title}</p>
            <p className="text-xs text-white/60">
              {category} · Zorixa AI
            </p>
          </div>
          {openUrl ? (
            <a
              href={openUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-sm font-medium text-[#00e5ff] hover:opacity-80"
            >
              Open original
            </a>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

function GridMedia({ item }: { item: GenerationTile }) {
  const isVideo = Boolean(item.videoSrc);

  if (isVideo) {
    if (item.src) {
      return (
        <>
          <ExternalImage
            src={item.src}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25">
            <span className="grid size-12 place-items-center rounded-full bg-black/50 text-white ring-2 ring-white/30">
              <Play className="ml-0.5 size-6 fill-white" aria-hidden />
            </span>
          </div>
        </>
      );
    }
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-zinc-900 text-zorixa-muted">
        <Clapperboard className="size-12 opacity-60" aria-hidden />
        <span className="grid size-10 place-items-center rounded-full bg-[rgba(131,56,235,0.85)] text-white">
          <Play className="ml-0.5 size-5 fill-white" aria-hidden />
        </span>
      </div>
    );
  }

  if (item.src) {
    return (
      <ExternalImage
        src={item.src}
        alt={item.title}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    );
  }

  return (
    <div className="grid size-full place-items-center text-sm text-zorixa-muted">
      No preview
    </div>
  );
}

export function GenerationGrid({
  items,
  className
}: {
  items: GenerationTile[];
  className?: string;
}) {
  const [selected, setSelected] = useState<GenerationTile | null>(null);
  const close = useCallback(() => setSelected(null), []);

  return (
    <>
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {items.map((item, i) => {
          const category =
            item.categoryLabel ??
            (item.kind === "video" ? "UGC video" : "AI image");
          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              onClick={() => setSelected(item)}
              className={cn(
                "zorixa-card-border group overflow-hidden rounded-2xl bg-zorixa-card text-left shadow-glow",
                "transition-shadow hover:shadow-glow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]/50"
              )}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                <GridMedia item={item} />
                <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4">
                  <p className="truncate font-medium text-white">{item.title}</p>
                  <p className="text-xs text-white/60">
                    {category} · Zorixa AI
                  </p>
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected ? <HistoryLightbox item={selected} onClose={close} /> : null}
      </AnimatePresence>
    </>
  );
}
