"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function VideoLightbox({
  open,
  src,
  title,
  onClose
}: {
  open: boolean;
  src: string | null;
  title?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && src ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Video preview"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/75"
                aria-label="Close preview"
              >
                <X className="size-5" />
              </button>
              <video
                key={src}
                src={src}
                controls
                autoPlay
                playsInline
                className="max-h-[min(85vh,820px)] w-full bg-black object-contain"
              />
            </div>
            {title ? (
              <p className="mt-3 truncate px-1 text-center text-sm text-white/70">{title}</p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
