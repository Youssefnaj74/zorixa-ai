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

/** Atlas-style reference column: header + thumbs + large Add dropzone. */
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

  return (
    <div className="flex min-h-0 min-w-0 flex-col rounded-lg border border-white/[0.08] bg-[#0c0c14]/80 p-2.5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/92">
            <Icon className="size-3.5 shrink-0 text-brand" aria-hidden />
            {title}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-zorixa-muted/95">{hint}</p>
        </div>
        <span className="shrink-0 rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/85">
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

      {filledCount > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {urls.map((url, index) =>
            url ? (
              <div key={`${kind}-${index}`} className="relative">
                <div className="relative size-14 overflow-hidden rounded-lg border border-white/10 bg-black/50">
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
                      <Music2 className="size-4" aria-hidden />
                    </div>
                  )}
                  <span className="absolute left-0.5 top-0.5 max-w-[calc(100%-4px)] truncate rounded bg-brand px-1 py-px text-[7px] font-bold text-white">
                    {seedanceReferencePromptToken(kind, index)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange?.(index, null)}
                  className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border border-white/10 bg-black/80 text-white/90 hover:bg-black"
                  aria-label={`Remove ${title} ${index + 1}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : null
          )}
        </div>
      ) : null}

      {canAddMore ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragEnter={stopDrag}
          onDragOver={stopDrag}
          onDrop={(e) => {
            stopDrag(e);
            applyFiles(Array.from(e.dataTransfer.files ?? []));
          }}
          className={cn(
            "flex min-h-[88px] flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 bg-black/35 px-2 text-zorixa-muted transition-colors",
            "hover:border-brand/40 hover:bg-black/50"
          )}
        >
          <Upload className="size-5 opacity-70" aria-hidden />
          <span className="text-[11px] font-medium text-white/75">Add</span>
          <span className="text-[9px] uppercase tracking-wide text-zorixa-muted/80">
            max {maxSlots}
          </span>
        </button>
      ) : null}
    </div>
  );
}
