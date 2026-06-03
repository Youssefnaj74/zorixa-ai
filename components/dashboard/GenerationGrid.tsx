"use client";

import { useCallback, useEffect, useMemo, useState, type VideoHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clapperboard, Download, Mic, Play, Volume2, X } from "lucide-react";

import { ExternalImage } from "@/components/ui/ExternalImage";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { downloadImageFile, imageDownloadFilename } from "@/lib/download-image-file";
import { normalizeAtlasVideoUrlForPlayback } from "@/lib/resolve-video-playback-url";
import { buildSameOriginVideoPlaybackUrl } from "@/lib/video-playback-proxy";
import {
  historyCreditsBadgeClass,
  historyCreditsLabel
} from "@/lib/history-credits-label";
import type { GenerationTile } from "@/lib/generation-tile";
import { cn } from "@/lib/utils";

export type { GenerationTile } from "@/lib/generation-tile";

function HistoryCreditsBadge({
  creditsSpent,
  status,
  className
}: {
  creditsSpent?: number;
  status?: string;
  className?: string;
}) {
  const { label, tone } = historyCreditsLabel(creditsSpent, status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums tracking-wide backdrop-blur-sm",
        historyCreditsBadgeClass(tone),
        className
      )}
    >
      {label}
    </span>
  );
}

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

function HistoryAudioLightbox({
  item,
  onClose
}: {
  item: GenerationTile;
  onClose: () => void;
}) {
  const openUrl = item.audioSrc ?? item.src;

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

  const category = item.categoryLabel ?? "Text to Speech · Zorixa AI";

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
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zorixa-card p-6 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/15 bg-black/40 text-white hover:bg-white/10"
          aria-label="Close preview"
        >
          <X className="size-4" />
        </button>

        <motion.div className="flex flex-col items-center gap-4 pt-2">
          <span className="grid size-16 place-items-center rounded-2xl bg-[#00e5ff]/10 text-[#00e5ff]">
            <Mic className="size-8" aria-hidden />
          </span>
          {item.audioSrc ? (
            <audio
              src={item.audioSrc}
              controls
              autoPlay
              preload="auto"
              className="w-full"
            />
          ) : (
            <p className="text-sm text-zorixa-muted">No audio preview</p>
          )}
        </motion.div>

        <div className="mt-5 space-y-1 border-t border-white/10 pt-4">
          <p className="font-medium text-white">{item.title}</p>
          <p className="text-xs text-white/60">{category}</p>
          <HistoryCreditsBadge creditsSpent={item.creditsSpent} status={item.status} className="mt-2" />
          {openUrl ? (
            <a
              href={openUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex pt-2 text-sm font-medium text-[#00e5ff] hover:opacity-80"
            >
              Download MP3
            </a>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

function HistoryVideoLightbox({
  item,
  onClose
}: {
  item: GenerationTile;
  onClose: () => void;
}) {
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
          {playbackUrl ? (
            <video
              key={playbackUrl}
              src={playbackUrl}
              controls
              playsInline
              preload="auto"
              {...domVideoAttrs}
              className="max-h-[78vh] w-full object-contain"
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
            <HistoryCreditsBadge
              creditsSpent={item.creditsSpent}
              status={item.status}
              className="mt-2"
            />
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

function HistoryImageDownloadButton({
  url,
  title,
  className
}: {
  url: string;
  title?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const onDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await downloadImageFile(url, imageDownloadFilename(url, title));
    } catch (err) {
      console.error("[History] image download failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => void onDownload(e)}
      disabled={busy}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 disabled:opacity-60",
        className
      )}
      aria-label={busy ? "Downloading image" : "Download image"}
    >
      <Download className="size-4" aria-hidden />
    </button>
  );
}

function GridMedia({ item }: { item: GenerationTile }) {
  const isAudio = item.kind === "audio" || Boolean(item.audioSrc);

  if (isAudio) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#8338eb]/20 via-zinc-900 to-[#00e5ff]/10 text-[#00e5ff]">
        <span className="grid size-14 place-items-center rounded-2xl bg-black/30 ring-1 ring-[#00e5ff]/30">
          <Mic className="size-7" aria-hidden />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white/80">
          <Volume2 className="size-3.5" aria-hidden />
          Listen
        </span>
      </div>
    );
  }

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
  const selectedImageSrc =
    selected && !selected.videoSrc && !selected.audioSrc && selected.src ? selected.src : null;
  const selectedVideo =
    selected && selected.videoSrc && selected.kind !== "audio" ? selected : null;
  const selectedAudio =
    selected && (selected.kind === "audio" || selected.audioSrc) ? selected : null;

  return (
    <>
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {items.map((item, i) => {
          const footer =
            item.categoryLabel ??
            (item.kind === "audio"
              ? "Text to Speech · Zorixa AI"
              : item.kind === "video"
                ? "UGC video · Zorixa AI"
                : "AI image · Zorixa AI");
          const isHistoryImage =
            item.kind !== "audio" &&
            item.kind !== "video" &&
            !item.videoSrc &&
            !item.audioSrc &&
            Boolean(item.src);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className={cn(
                "zorixa-card-border group overflow-hidden rounded-2xl bg-zorixa-card text-left shadow-glow",
                "transition-shadow hover:shadow-glow-lg"
              )}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className={cn(
                    "absolute inset-0 z-0 cursor-zoom-in text-left",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00e5ff]/50"
                  )}
                  aria-label={`Open ${item.title}`}
                >
                  <GridMedia item={item} />
                </button>
                {isHistoryImage && item.src ? (
                  <div className="absolute left-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <HistoryImageDownloadButton url={item.src} title={item.title} />
                  </div>
                ) : null}
                <div className="pointer-events-none absolute right-3 top-3 z-10">
                  <HistoryCreditsBadge creditsSpent={item.creditsSpent} status={item.status} />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4">
                  <p className="truncate font-medium text-white">{item.title}</p>
                  <p className="text-xs text-white/60">{footer}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <ImageLightbox
        open={Boolean(selectedImageSrc)}
        src={selectedImageSrc}
        alt={selected?.title ?? "History preview"}
        title={selected?.title}
        downloadUrl={selectedImageSrc}
        onClose={close}
      />

      <AnimatePresence>
        {selectedVideo ? (
          <HistoryVideoLightbox item={selectedVideo} onClose={close} />
        ) : null}
        {selectedAudio ? (
          <HistoryAudioLightbox item={selectedAudio} onClose={close} />
        ) : null}
      </AnimatePresence>
    </>
  );
}
