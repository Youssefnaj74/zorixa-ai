"use client";

import { Film, Music2, Upload, X } from "lucide-react";
import { useCallback, useRef } from "react";

import { seedanceReferencePromptToken } from "@/lib/seedance-reference-prompt-tokens";
import { cn } from "@/lib/utils";

export type ReferenceMediaKind = "video" | "audio";

type ReferenceMediaUploadStripProps = {
  label: string;
  mediaUrls: (string | null)[];
  maxSlots: number;
  mediaKind: ReferenceMediaKind;
  accept: string;
  onMediaChange?: (index: number, url: string | null) => void;
  tokenKind?: ReferenceMediaKind;
  compact?: boolean;
  className?: string;
};

function fileMatchesKind(file: File, mediaKind: ReferenceMediaKind): boolean {
  if (mediaKind === "video") return file.type.startsWith("video/");
  return file.type.startsWith("audio/");
}

export function ReferenceMediaUploadStrip({
  label,
  mediaUrls,
  maxSlots,
  mediaKind,
  accept,
  onMediaChange,
  tokenKind,
  compact = false,
  className
}: ReferenceMediaUploadStripProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const filledCount = mediaUrls.filter(Boolean).length;
  const EmptyIcon = mediaKind === "video" ? Film : Music2;

  const stopDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const applyFiles = useCallback(
    (files: File[]) => {
      if (!onMediaChange || files.length === 0) return;
      let slot = 0;
      for (const file of files) {
        if (!fileMatchesKind(file, mediaKind)) continue;
        while (slot < maxSlots && mediaUrls[slot]) slot++;
        if (slot >= maxSlots) break;
        onMediaChange(slot, URL.createObjectURL(file));
        slot++;
      }
    },
    [maxSlots, mediaKind, mediaUrls, onMediaChange]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) applyFiles(files);
      e.target.value = "";
    },
    [applyFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      stopDrag(e);
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length) applyFiles(files);
    },
    [applyFiles, stopDrag]
  );

  return (
    <div className={cn("flex shrink-0 flex-col gap-2", !compact && "sm:w-auto sm:min-w-[160px]", className)}>
      {!compact ? (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
          {label}
        </span>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={onFileInput}
      />
      <div
        className="flex flex-wrap items-start gap-2"
        onDragEnter={stopDrag}
        onDragOver={stopDrag}
        onDrop={onDrop}
      >
        {mediaUrls.map((url, index) =>
          url ? (
            <div key={`${mediaKind}-ref-${index}`} className="relative">
              <div className="relative flex size-[72px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:size-[80px]">
                {mediaKind === "video" ? (
                  <video
                    src={url}
                    className="absolute inset-0 size-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-zorixa-muted">
                    <Music2 className="size-5 opacity-80" aria-hidden />
                    <audio src={url} className="hidden" preload="metadata" />
                  </div>
                )}
                {tokenKind ? (
                  <span className="absolute left-1 top-1 max-w-[calc(100%-8px)] truncate rounded bg-brand/90 px-1 py-0.5 text-[8px] font-bold text-white">
                    {seedanceReferencePromptToken(tokenKind, index)}
                  </span>
                ) : (
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
                    {index + 1}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onMediaChange?.(index, null)}
                className={cn(
                  "absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                  "hover:bg-black hover:text-white"
                )}
                aria-label={`Remove ${label} ${index + 1}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : null
        )}
        {filledCount < maxSlots ? (
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "grid size-[72px] place-items-center rounded-xl border border-dashed border-white/20 bg-black/40 text-zorixa-muted transition-colors sm:size-[80px]",
                "hover:border-white/30 hover:bg-black/55"
              )}
              aria-label={`Add ${label}`}
            >
              <Upload className="size-4 opacity-70" />
              <EmptyIcon className="mt-0.5 size-3.5 opacity-50" aria-hidden />
              {compact ? (
                <span className="mt-1 text-[9px] font-medium text-zorixa-muted">Add</span>
              ) : null}
            </button>
            {!compact ? (
              <>
                <span className="text-[11px] tabular-nums text-zorixa-muted">
                  {filledCount}/{maxSlots}
                </span>
                <span className="text-[9px] font-medium uppercase tracking-wide text-zorixa-muted/80">
                  max {maxSlots}
                </span>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
