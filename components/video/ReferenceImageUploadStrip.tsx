"use client";

import { Upload, X } from "lucide-react";
import { useCallback, useRef } from "react";

import { REFERENCE_TO_VIDEO_MAX_IMAGES } from "@/components/video/bottom-bar-models";
import { cn } from "@/lib/utils";

type ReferenceImageUploadStripProps = {
  referenceImageUrls: (string | null)[];
  onReferenceImageChange?: (index: number, url: string | null) => void;
  className?: string;
};

export function ReferenceImageUploadStrip({
  referenceImageUrls,
  onReferenceImageChange,
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
        while (slot < REFERENCE_TO_VIDEO_MAX_IMAGES && referenceImageUrls[slot]) slot++;
        if (slot >= REFERENCE_TO_VIDEO_MAX_IMAGES) break;
        onReferenceImageChange(slot, URL.createObjectURL(file));
        slot++;
      }
    },
    [onReferenceImageChange, referenceImageUrls]
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
    <div className={cn("flex shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[200px]", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
        References
      </span>
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
              <div className="relative flex size-[72px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:size-[80px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
                  {index + 1}
                </span>
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
        {filledCount < REFERENCE_TO_VIDEO_MAX_IMAGES ? (
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "grid size-[72px] place-items-center rounded-xl border border-dashed border-white/20 bg-black/40 text-zorixa-muted transition-colors sm:size-[80px]",
                "hover:border-white/30 hover:bg-black/55"
              )}
              aria-label="Add reference image"
            >
              <Upload className="size-5 opacity-70" />
            </button>
            <span className="text-[11px] tabular-nums text-zorixa-muted">
              {filledCount}/{REFERENCE_TO_VIDEO_MAX_IMAGES}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
