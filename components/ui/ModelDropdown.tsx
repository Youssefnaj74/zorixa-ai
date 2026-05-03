"use client";

import type { ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export type ModelOption = {
  id: string;
  label: string;
  badge?: ReactNode;
  /** Short limit label for dropdown row pill, e.g. "14 imgs" */
  limitShort?: string;
  /** Line under bottom-bar model trigger, e.g. "14 images per generation" */
  limitDetail?: string;
};

export function ModelLimitPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-[rgba(131,56,235,0.3)] bg-[rgba(131,56,235,0.15)] px-2 py-0.5 text-[11px] leading-none text-[#9b7dff]"
      )}
    >
      {children}
    </span>
  );
}

/** Shared catalog for sidebar dropdown + image bottom bar model display. */
export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "gpt-image-2",
    label: "GPT Image 2",
    badge: <Badge variant="newTeal">NEW</Badge>,
    limitShort: "16 imgs",
    limitDetail: "16 images per generation"
  },
  {
    id: "nano-banana-2",
    label: "Nano Banana 2",
    badge: <Badge variant="fullAccess">FULL ACCESS</Badge>,
    limitShort: "14 imgs",
    limitDetail: "14 images per generation"
  },
  {
    id: "nano-banana",
    label: "Nano Banana",
    badge: <Badge variant="pro">PRO</Badge>,
    limitShort: "8 imgs",
    limitDetail: "8 images per generation"
  },
  {
    id: "enhancor",
    label: "Enhancor",
    badge: <Badge variant="fullAccess">FULL ACCESS</Badge>,
    limitShort: "4 imgs",
    limitDetail: "4 images per generation"
  },
  {
    id: "seedream-5",
    label: "Seedream 5 Lite",
    badge: <Badge variant="fullAccess">FULL ACCESS</Badge>,
    limitShort: "10 imgs",
    limitDetail: "10 images per generation"
  },
  {
    id: "grok-imagine",
    label: "Grok Imagine",
    limitShort: "1 img",
    limitDetail: "1 image per generation"
  }
];

export function ModelDropdown({
  value,
  onChange,
  models = MODEL_OPTIONS,
  className
}: {
  value: string;
  onChange: (id: string) => void;
  models?: ModelOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = models.find((m) => m.id === value) ?? models[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="zorixa-card-border flex w-full items-center justify-between gap-2 rounded-xl bg-zorixa-card px-3 py-2.5 text-left text-sm text-white shadow-glow transition-shadow hover:shadow-glow-lg"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          <span className="truncate font-medium">{selected?.label}</span>
          {selected?.badge}
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-zorixa-muted transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="zorixa-card-border absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-72 overflow-auto rounded-xl bg-zorixa-bg-secondary p-1 shadow-glow-lg ring-1 ring-white/5"
          >
            {models.map((m) => {
              const active = m.id === value;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    active ? "bg-brand/15 text-white" : "text-white/90 hover:bg-white/5"
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate">{m.label}</span>
                    {m.badge}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {m.limitShort ? <ModelLimitPill>{m.limitShort}</ModelLimitPill> : null}
                    {active ? <Check className="size-4 shrink-0 text-brand-light" /> : null}
                  </span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
