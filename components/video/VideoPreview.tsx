"use client";

import { Download, Expand, History, Play, RotateCcw } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ActionTab } from "@/components/video/ActionTabsRow";
import { ActionTabsRow } from "@/components/video/ActionTabsRow";

const NAV_H = 56;
const TABS_ROW_H = 48;

export function VideoPreview({
  actionTab,
  onActionTabChange,
  videoUrl,
  loading,
  promptThumbUrl,
  bottomBarHeight = 130,
  className
}: {
  actionTab: ActionTab;
  onActionTabChange: (t: ActionTab) => void;
  videoUrl: string | null;
  loading: boolean;
  /** Small reference thumbnail (e.g. @PRODUCT_IMAGE1) shown top-center */
  promptThumbUrl?: string | null;
  /** Measured fixed bottom bar height — drives preview card max-height. */
  bottomBarHeight?: number;
  className?: string;
}) {
  const cardMaxHeight = `calc(100vh - ${NAV_H}px - ${TABS_ROW_H}px - ${bottomBarHeight}px)`;

  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 font-body", className)}>
      <div
        className={cn(
          "zorixa-card-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-zorixa-card shadow-glow"
        )}
        style={{ maxHeight: cardMaxHeight }}
      >
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
          <h2 className="font-display text-sm font-semibold text-white">Video Preview</h2>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10"
            >
              Upscale Video
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10"
            >
              Extend Video
            </Button>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-zorixa-muted hover:bg-white/5 hover:text-white"
              aria-label="Expand"
            >
              <Expand className="size-4" />
            </button>
            <span className="flex shrink-0 items-center gap-1 font-display text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted sm:text-xs">
              <History className="size-3.5" />
              History
            </span>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col bg-zorixa-preview">
          {promptThumbUrl ? (
            <div className="flex shrink-0 justify-center pt-3">
              <div className="relative size-16 overflow-hidden rounded-lg ring-1 ring-[rgba(131,56,235,0.25)]">
                <Image src={promptThumbUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            </div>
          ) : null}

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="size-12 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                  <p className="text-sm text-zorixa-muted">Generating video…</p>
                </div>
              ) : videoUrl ? (
                <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center">
                  <video
                    src={videoUrl}
                    controls
                    className="max-h-full max-w-full rounded-xl object-contain shadow-[0_0_24px_rgba(131,56,235,0.2)] ring-1 ring-[rgba(131,56,235,0.15)]"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.06 }}
                    className="grid size-16 shrink-0 place-items-center rounded-full bg-[rgba(131,56,235,0.8)] text-white shadow-[0_0_32px_rgba(131,56,235,0.45)] ring-2 ring-white/20"
                    aria-label="Play preview"
                  >
                    <Play className="ml-1 size-7 fill-white" />
                  </motion.button>
                  <p className="text-sm text-zorixa-muted">Video preview</p>
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="pointer-events-auto h-9 rounded-lg border border-white/15 bg-black/40 px-3 text-xs text-white backdrop-blur hover:bg-black/60"
              >
                <RotateCcw className="mr-1 size-3.5" />
                Reset to Defaults
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="pointer-events-auto h-9 rounded-lg border border-brand/50 bg-black/30 px-3 text-xs text-white hover:bg-brand/20"
              >
                <Download className="mr-1 size-3.5" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex h-12 w-full shrink-0 items-center bg-[#0a0a0f]">
        <ActionTabsRow active={actionTab} onChange={onActionTabChange} className="h-full min-h-0 w-full flex-1" />
      </div>
    </div>
  );
}
