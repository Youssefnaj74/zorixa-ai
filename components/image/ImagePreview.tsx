"use client";

import { Download, Expand, History, ImageIcon, RotateCcw } from "lucide-react";

import type { ImageActionTab } from "@/components/image/ImageActionTabsRow";
import { ImageActionTabsRow } from "@/components/image/ImageActionTabsRow";
import { Button } from "@/components/ui/button";
import { ExternalImage } from "@/components/ui/ExternalImage";
import { cn } from "@/lib/utils";

const NAV_H = 56;
const TABS_ROW_H = 48;

export function ImagePreview({
  actionTab,
  onActionTabChange,
  imageUrl,
  loading,
  errorMessage,
  referenceThumbUrl,
  bottomBarHeight = 130,
  className
}: {
  actionTab: ImageActionTab;
  onActionTabChange: (t: ImageActionTab) => void;
  imageUrl: string | null;
  loading?: boolean;
  errorMessage?: string | null;
  referenceThumbUrl?: string | null;
  bottomBarHeight?: number;
  className?: string;
}) {
  const cardMaxHeight = `calc(100vh - ${NAV_H}px - ${TABS_ROW_H}px - ${bottomBarHeight}px)`;

  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 font-body", className)}>
      <div
        className="zorixa-card-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-zorixa-card shadow-glow"
        style={{ maxHeight: cardMaxHeight }}
      >
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
          <h2 className="font-display text-sm font-semibold text-white">Image Preview</h2>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10"
            >
              Upscale Image
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10"
            >
              Variations
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
          {referenceThumbUrl ? (
            <div className="flex shrink-0 justify-center pt-3">
              <div className="relative size-16 overflow-hidden rounded-lg ring-1 ring-[rgba(131,56,235,0.25)]">
                <ExternalImage
                  src={referenceThumbUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="size-full object-cover"
                />
              </div>
            </div>
          ) : null}

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="size-12 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                  <p className="text-sm text-zorixa-muted">Generating image…</p>
                </div>
              ) : errorMessage ? (
                <p className="max-w-md text-center text-sm text-red-400">{errorMessage}</p>
              ) : imageUrl ? (
                <ExternalImage
                  src={imageUrl}
                  alt="Generated output"
                  width={1024}
                  height={1024}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-[0_0_24px_rgba(131,56,235,0.2)] ring-1 ring-[rgba(131,56,235,0.15)]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="grid size-16 place-items-center rounded-full bg-[rgba(131,56,235,0.25)] text-brand-light ring-2 ring-white/10">
                    <ImageIcon className="size-8" />
                  </div>
                  <p className="text-sm text-zorixa-muted">Image preview</p>
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
              {imageUrl ? (
                <a
                  href={imageUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="pointer-events-auto inline-flex h-9 items-center justify-center rounded-lg border border-brand/50 bg-black/30 px-3 text-xs font-medium text-white transition-colors hover:bg-brand/20"
                >
                  <Download className="mr-1 size-3.5" />
                  Download
                </a>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  disabled
                  className="pointer-events-auto h-9 cursor-not-allowed rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-zorixa-muted opacity-50"
                >
                  <Download className="mr-1 size-3.5" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex h-12 w-full shrink-0 items-center bg-[#0a0a0f]">
        <ImageActionTabsRow active={actionTab} onChange={onActionTabChange} className="h-full min-h-0 w-full flex-1" />
      </div>
    </div>
  );
}
