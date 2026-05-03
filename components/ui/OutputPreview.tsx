"use client";

import {
  Download,
  Expand,
  History,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Share2
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

function PlaceholderVideo() {
  return (
    <div className="flex aspect-video w-full max-w-lg flex-col items-center justify-center rounded-xl bg-zorixa-bg-secondary ring-1 ring-white/10">
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-brand/20">
        <div className="ml-1 size-0 border-y-8 border-y-transparent border-l-[14px] border-l-white" />
      </div>
      <p className="text-sm text-zorixa-muted">Video preview</p>
    </div>
  );
}

export function OutputPreview({
  mode = "image",
  imageSrc,
  loading,
  index = 1,
  total = 1,
  className
}: {
  mode?: "image" | "video";
  imageSrc?: string | null;
  loading?: boolean;
  index?: number;
  total?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const downloadHref = useMemo(() => imageSrc ?? "", [imageSrc]);

  const onDownload = useCallback(() => {
    if (!downloadHref) return;
    const a = document.createElement("a");
    a.href = downloadHref;
    a.download = mode === "video" ? "zorixa-generation.mp4" : "zorixa-generation.png";
    a.rel = "noopener";
    a.click();
  }, [downloadHref, mode]);

  return (
    <div
      className={cn(
        "zorixa-card-border flex min-h-0 flex-1 flex-col rounded-2xl bg-zorixa-card shadow-glow transition-shadow hover:shadow-glow-lg",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="font-display text-sm font-semibold tracking-tight text-white">Output Preview</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-lg border border-white/10 bg-transparent text-xs text-white hover:bg-white/10"
          >
            <RotateCcw className="mr-1 size-3.5" />
            Reset to Defaults
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-lg border border-white/10 bg-transparent text-xs text-white hover:bg-white/10"
          >
            <Pencil className="mr-1 size-3.5" />
            Draw to Edit
          </Button>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="grid size-8 place-items-center rounded-lg border border-white/10 text-zorixa-muted hover:bg-white/5 hover:text-white"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <Expand className="size-4" />
          </button>
          <span className="flex items-center gap-1 font-display text-xs font-semibold uppercase tracking-wider text-zorixa-muted">
            <History className="size-3.5" />
            History
          </span>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-6">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="size-12 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
              <p className="text-sm text-zorixa-muted">Generating…</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={imageSrc ?? "empty"}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative flex h-full min-h-0 w-full max-w-2xl flex-col items-center justify-center",
                  expanded && "max-w-4xl"
                )}
              >
                {mode === "image" ? (
                  imageSrc ? (
                    <div className="relative flex max-h-full max-w-full items-center justify-center rounded-xl shadow-[0_0_24px_rgba(131,56,235,0.25)] ring-2 ring-brand/40">
                      <Image
                        src={imageSrc}
                        alt="Generation output"
                        width={1024}
                        height={1024}
                        className="max-h-full w-auto max-w-full rounded-xl object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/15 bg-zorixa-bg-secondary/80 px-10 py-16 text-center text-sm text-zorixa-muted">
                      Run a generation to see output here.
                    </div>
                  )
                ) : imageSrc ? (
                  <video
                    src={imageSrc}
                    controls
                    className="max-h-[min(56vh,520px)] w-full max-w-2xl rounded-xl shadow-[0_0_24px_rgba(131,56,235,0.25)] ring-2 ring-brand/40"
                  />
                ) : (
                  <PlaceholderVideo />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="flex w-full max-w-2xl shrink-0 flex-wrap items-center justify-between gap-3">
          <span className="text-sm tabular-nums text-zorixa-muted">
            {index}/{total}
          </span>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-lg border border-brand/40 bg-transparent text-sm text-brand-light hover:bg-brand/10"
          >
            Use Image
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg border border-white/10 bg-transparent text-xs text-white hover:bg-white/10"
            >
              <MoreHorizontal className="mr-1 size-4" />
              More Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="zorixa-card-border min-w-[180px] border-zorixa-border bg-zorixa-bg-secondary text-white"
          >
            <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white">
              <Share2 className="mr-2 size-4" />
              Share link
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white">
              Duplicate settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-lg border border-white/10 bg-transparent text-xs text-white hover:bg-white/10"
        >
          Transfer Motion
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onDownload}
          disabled={!downloadHref}
          className="ml-auto h-9 rounded-lg border border-brand/40 bg-transparent text-xs text-brand-light hover:bg-brand/10 disabled:opacity-40"
        >
          <Download className="mr-1 size-4" />
          Download
        </Button>
      </div>
    </div>
  );
}
