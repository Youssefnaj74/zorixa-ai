"use client";

import { Film, ImageIcon, Music2, Upload, X } from "lucide-react";
import { useCallback, useRef } from "react";

import { seedanceReferencePromptToken } from "@/lib/seedance-reference-prompt-tokens";
import { cn } from "@/lib/utils";

export type ReferenceAtlasColumnKind = "image" | "video" | "audio";

type ReferenceAtlasColumnUploadProps = {
  kind: ReferenceAtlasColumnKind;
  title: string;
  hint: string;
  urls: (string | null)[];
  maxSlots: number;
  accept: string;
  onChange?: (index: number, url: string | null) => void;
};

const KIND_ICON = {
  image: ImageIcon,
  video: Film,
  audio: Music2
} as const;

function fileMatchesKind(file: File, kind: ReferenceAtlasColumnKind): boolean {
  if (kind === "image") return file.type.startsWith("image/");
  if (kind === "video") return file.type.startsWith("video/");
  return file.type.startsWith("audio/");
}

/** Atlas-style reference column: header + compact Add zone with inline thumbs. */
export function ReferenceAtlasColumnUpload({
  kind,
  title,
  hint,
  urls,
  maxSlots,
  accept,
  onChange
}: ReferenceAtlasColumnUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const Icon = KIND_ICON[kind];
  const filledCount = urls.filter(Boolean).length;
  const canAddMore = filledCount < maxSlots;

  const stopDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const applyFiles = useCallback(
    (files: File[]) => {
      if (!onChange || files.length === 0) return;
      let slot = 0;
      for (const file of files) {
        if (!fileMatchesKind(file, kind)) continue;
        while (slot < maxSlots && urls[slot]) slot++;
        if (slot >= maxSlots) break;
        onChange(slot, URL.createObjectURL(file));
        slot++;
      }
    },
    [kind, maxSlots, onChange, urls]
  );

  const openPicker = useCallback(() => {
    fileRef.current?.click();
  }, []);

  return (
    <div className="flex min-h-0 min-w-0 flex-col rounded-lg border border-white/[0.08] bg-[#0c0c14]/80 p-2">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/92">
            <Icon className="size-3 shrink-0 text-brand" aria-hidden />
            {title}
          </p>
          <p className="mt-0.5 text-[9px] leading-snug text-zorixa-muted/95">{hint}</p>
        </div>
        <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-px text-[9px] font-semibold tabular-nums text-white/85">
          {filledCount}/{maxSlots}
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={kind === "image"}
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) applyFiles(files);
          e.target.value = "";
        }}
      />

      <div
        className={cn(
          "min-h-[56px] rounded-lg border border-dashed border-white/20 bg-black/35 p-1 transition-colors",
          canAddMore && "hover:border-brand/35 hover:bg-black/45"
        )}
        onDragEnter={canAddMore ? stopDrag : undefined}
        onDragOver={canAddMore ? stopDrag : undefined}
        onDrop={
          canAddMore
            ? (e) => {
                stopDrag(e);
                applyFiles(Array.from(e.dataTransfer.files ?? []));
              }
            : undefined
        }
      >
        {filledCount === 0 && canAddMore ? (
          <button
            type="button"
            onClick={openPicker}
            className="flex h-[52px] w-full flex-col items-center justify-center gap-0.5 text-zorixa-muted"
          >
            <Upload className="size-4 opacity-70" aria-hidden />
            <span className="text-[10px] font-medium text-white/75">Add</span>
            <span className="text-[8px] uppercase tracking-wide text-zorixa-muted/80">
              max {maxSlots}
            </span>
          </button>
        ) : (
          <div className="flex flex-wrap gap-1">
            {urls.map((url, index) =>
              url ? (
                <div key={`${kind}-${index}`} className="relative">
                  <div className="relative size-9 overflow-hidden rounded-md border border-white/10 bg-black/50">
                    {kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="size-full object-cover" />
                    ) : kind === "video" ? (
                      <video
                        src={url}
                        className="size-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-zorixa-muted">
                        <Music2 className="size-3" aria-hidden />
                      </div>
                    )}
                    <span className="absolute left-px top-px max-w-[calc(100%-2px)] truncate rounded bg-brand px-0.5 py-px text-[6px] font-bold leading-none text-white">
                      {seedanceReferencePromptToken(kind, index)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange?.(index, null)}
                    className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full border border-white/10 bg-black/85 text-white/90 hover:bg-black"
                    aria-label={`Remove ${title} ${index + 1}`}
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              ) : null
            )}
            {canAddMore ? (
              <button
                type="button"
                onClick={openPicker}
                className="flex size-9 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-white/20 bg-black/25 text-zorixa-muted transition-colors hover:border-brand/40 hover:text-white/80"
                aria-label={`Add ${title}`}
              >
                <Upload className="size-3.5 opacity-80" aria-hidden />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
