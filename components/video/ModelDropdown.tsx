"use client";

import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

import type { VideoModelOption } from "@/components/video/model-options";
import { VIDEO_MODELS } from "@/components/video/model-options";

export function ModelDropdown({
  value,
  onChange,
  models = VIDEO_MODELS,
  className
}: {
  value: string;
  onChange: (id: string) => void;
  models?: VideoModelOption[];
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
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zorixa-muted">Model</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="zorixa-card-border flex w-full items-center justify-between gap-2 rounded-xl bg-zorixa-card px-3 py-2.5 text-left text-sm text-white shadow-glow transition-shadow hover:shadow-glow-lg"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          <span className="truncate font-medium">{selected?.label}</span>
          {selected?.badge === "fullAccess" ? <Badge variant="fullAccess">FULL ACCESS</Badge> : null}
        </span>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-zorixa-muted" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-zorixa-muted" />
        )}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.94, y: -6 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.96, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ originY: 0 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-[rgba(131,56,235,0.2)] bg-zorixa-dropdown shadow-glow-lg ring-1 ring-white/5"
          >
            <ul className="max-h-80 overflow-auto py-1">
              {models.map((m) => {
                const isSelected = m.id === value;
                const disabled = m.locked;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        onChange(m.id);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected && "bg-zorixa-selected text-white",
                        !isSelected && !disabled && "text-white/95 hover:bg-[rgba(131,56,235,0.1)]",
                        disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate">{m.label}</span>
                        {m.locked ? <span aria-hidden>🔒</span> : null}
                        {m.badge === "newTeal" ? <Badge variant="newTeal">NEW</Badge> : null}
                        {m.badge === "pro" ? <Badge variant="pro">PRO</Badge> : null}
                        {m.badge === "fullAccess" ? <Badge variant="fullAccess">FULL ACCESS</Badge> : null}
                      </span>
                      {isSelected && !disabled ? <Check className="size-4 shrink-0 text-white" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
