"use client";

import { Upload } from "lucide-react";
import { useCallback, useRef } from "react";

import { cn } from "@/lib/utils";

export type UploadZoneProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  /** Called when user selects or drops a file (images & videos). */
  onFileSelected?: (file: File) => void;
  accept?: string;
};

export function UploadZone({
  title = "Drag & drop your assets",
  subtitle = "PNG, JPG, WebP, video — or click to browse",
  className,
  onFileSelected,
  accept = "image/*,video/*"
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const stopDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f && onFileSelected) onFileSelected(f);
      e.target.value = "";
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      stopDrag(e);
      const f = e.dataTransfer.files?.[0];
      if (f && onFileSelected) onFileSelected(f);
    },
    [onFileSelected, stopDrag]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={() => inputRef.current?.click()}
      onDragEnter={stopDrag}
      onDragOver={stopDrag}
      onDrop={handleDrop}
      className={cn(
        "cursor-pointer rounded-2xl border-2 border-dashed border-surface-border bg-surface-card p-12 text-center transition-shadow duration-300 hover:shadow-glow",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={handleChange}
      />
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-surface-elevated text-brand ring-1 ring-surface-border">
          <Upload className="size-7" strokeWidth={1.5} aria-hidden />
        </span>
        <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
        <p className="font-body text-sm text-white/50">{subtitle}</p>
      </div>
    </div>
  );
}
