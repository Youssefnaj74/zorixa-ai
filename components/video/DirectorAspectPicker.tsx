"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { DirectorAspectRatio } from "@/lib/ai-director/aspect-options";
import { cn } from "@/lib/utils";

const dropupPanelClass =
  "absolute bottom-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] shadow-glow-lg";

const triggerClass =
  "inline-flex h-9 min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] px-3 text-xs font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand";

export function DirectorAspectPicker({
  options,
  value,
  onChange,
  className
}: {
  options: readonly DirectorAspectRatio[];
  value: DirectorAspectRatio;
  onChange: (aspect: DirectorAspectRatio) => void;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const displayAspect = options.includes(value) ? value : (options[0] ?? value);
  const canPick = options.length > 1;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const toggleOpen = useCallback(() => {
    if (!canPick) return;
    setOpen((prev) => !prev);
  }, [canPick]);

  return (
    <div ref={rootRef} className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        onClick={toggleOpen}
        disabled={!canPick}
        aria-haspopup={canPick ? "listbox" : undefined}
        aria-expanded={canPick ? open : undefined}
        aria-label={`Aspect ratio ${displayAspect}`}
        className={cn(
          triggerClass,
          open && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]",
          !canPick && "cursor-default opacity-90"
        )}
      >
        <span className="tabular-nums">{displayAspect}</span>
        {canPick ? (
          <ChevronUp
            className={cn(
              "size-3.5 shrink-0 text-zorixa-muted transition-transform",
              open && "rotate-180"
            )}
          />
        ) : null}
      </button>
      <AnimatePresence>
        {open && canPick ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ transformOrigin: "bottom left" }}
            className={cn(dropupPanelClass, "left-0 min-w-[96px] py-1")}
            role="listbox"
            aria-label="Aspect ratio options"
          >
            {options.map((aspect) => (
              <button
                key={aspect}
                type="button"
                role="option"
                aria-selected={aspect === displayAspect}
                onClick={() => {
                  onChange(aspect);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm tabular-nums transition-colors",
                  aspect === displayAspect
                    ? "bg-zorixa-tab text-white"
                    : "text-white/95 hover:bg-[rgba(131,56,235,0.1)]"
                )}
              >
                {aspect}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
