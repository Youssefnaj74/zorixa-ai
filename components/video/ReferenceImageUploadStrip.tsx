"use client";

import { Upload, X } from "lucide-react";
import { useCallback, useRef } from "react";

import { seedanceReferencePromptToken } from "@/lib/seedance-reference-prompt-tokens";
import { cn } from "@/lib/utils";

type ReferenceImageUploadStripProps = {
  referenceImageUrls: (string | null)[];
  maxImages: number;
  onReferenceImageChange?: (index: number, url: string | null) => void;
  /** Show @imageN badge on thumbnails (Seedance R2V). */
  tokenKind?: "image";
  /** Hide outer title when wrapped in SeedanceReferenceUploadPanel. */
  compact?: boolean;
  /** Label inside the add slot (e.g. HappyHorse V2V "image"). */
  addSlotLabel?: string;
  /** Show filled/max count inside the add slot footer instead of below. */
  countInSlot?: boolean;
  /** Match Video-to-Video source video slot size (88×150). */
  matchSourceVideoSlot?: boolean;
  className?: string;
};

export function ReferenceImageUploadStrip({
  referenceImageUrls,
  maxImages,
  onReferenceImageChange,
  tokenKind,
  compact = false,
  addSlotLabel,
  countInSlot = false,
  matchSourceVideoSlot = false,
  className
}: ReferenceImageUploadStripProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const filledCount = referenceImageUrls.filter(Boolean).length;

  const stopDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const applyFiles = useCallback(
    (files: File[]) => {
      if (!onReferenceImageChange || files.length === 0) return;
      let slot = 0;
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        while (slot < maxImages && referenceImageUrls[slot]) slot++;
        if (slot >= maxImages) break;
        onReferenceImageChange(slot, URL.createObjectURL(file));
        slot++;
      }
    },
    [maxImages, onReferenceImageChange, referenceImageUrls]
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

  const thumbSize = matchSourceVideoSlot
    ? "size-[88px] min-h-[88px] min-w-[150px] max-w-[150px]"
    : "size-[72px] sm:size-[80px]";
  const addSlotSize = matchSourceVideoSlot
    ? "h-[88px] w-[150px]"
    : "size-[72px] sm:size-[80px]";

  return (
    <div className={cn("flex shrink-0 flex-col gap-2", !compact && "sm:w-auto sm:min-w-[200px]", className)}>
      {!compact && !addSlotLabel ? (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
          References
        </span>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
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
        {referenceImageUrls.map((url, index) =>
          url ? (
            <div key={`ref-${index}`} className="relative">
              <div
                className={cn(
                  "relative flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40",
                  thumbSize
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
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
                onClick={() => onReferenceImageChange?.(index, null)}
                className={cn(
                  "absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                  "hover:bg-black hover:text-white"
                )}
                aria-label={`Remove reference ${index + 1}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : null
        )}
        {filledCount < maxImages ? (
          <div className={cn("flex flex-col items-center", !countInSlot && "gap-1")}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/40 text-zorixa-muted transition-colors",
                addSlotSize,
                "hover:border-white/30 hover:bg-black/55",
                countInSlot && addSlotLabel && "justify-between py-3"
              )}
              aria-label="Add reference image"
            >
              <Upload className="size-5 shrink-0 opacity-70" />
              {addSlotLabel ? (
                <span className="text-xs font-medium text-zorixa-muted">{addSlotLabel}</span>
              ) : compact ? (
                <span className="mt-1 text-[9px] font-medium text-zorixa-muted">Add</span>
              ) : null}
              {countInSlot ? (
                <span className="text-[11px] tabular-nums text-zorixa-muted">
                  {filledCount}/{maxImages}
                </span>
              ) : null}
            </button>
            {!compact && !countInSlot ? (
              <span className="text-[11px] tabular-nums text-zorixa-muted">
                {filledCount}/{maxImages}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
