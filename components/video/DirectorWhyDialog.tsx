"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function DirectorWhyDialog({
  open,
  modelLabel,
  bullets,
  onClose
}: {
  open: boolean;
  modelLabel: string;
  bullets: string[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="director-why-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-xl border border-[#8338eb]/30 bg-[#14141c] p-4 shadow-2xl"
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 id="director-why-title" className="text-sm font-semibold text-white">
              Why {modelLabel}?
            </h3>
            <p className="mt-1 text-xs text-white/55">
              AI Director matched this model to your style and prompt.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="space-y-2">
          {bullets.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-white/85 before:mt-1.5 before:size-1.5 before:shrink-0 before:rounded-full before:bg-[#8338eb] before:content-['']"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
