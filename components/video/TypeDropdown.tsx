"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { TYPE_OPTIONS } from "@/components/video/model-options";

export function TypeDropdown({
  value,
  onChange,
  className
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zorixa-muted">
        Type <span className="text-brand-light">@</span>
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="zorixa-card-border flex w-full items-center justify-between gap-2 rounded-xl bg-zorixa-card px-3 py-2.5 text-left text-sm text-white"
      >
        <span
          className={cn(
            "truncate rounded-md px-2 py-0.5 font-medium",
            TYPE_OPTIONS.includes(value as (typeof TYPE_OPTIONS)[number]) && value === "UGC"
              ? "bg-zorixa-selected text-white"
              : ""
          )}
        >
          {value}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-zorixa-muted transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-[rgba(131,56,235,0.2)] bg-zorixa-dropdown py-1 shadow-glow-lg"
          >
            {TYPE_OPTIONS.map((opt) => {
              const active = opt === value;
              const highlightType = opt === "UGC";
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors",
                    active && "bg-zorixa-selected text-white",
                    !active && highlightType && "text-white/90 hover:bg-[rgba(131,56,235,0.1)]",
                    !active && !highlightType && "text-white/90 hover:bg-[rgba(131,56,235,0.1)]"
                  )}
                >
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5",
                      opt === "UGC" && active ? "bg-zorixa-selected" : opt === "UGC" ? "bg-zorixa-selected/80" : ""
                    )}
                  >
                    {opt}
                  </span>
                  {active ? <Check className="size-4 text-white" /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
