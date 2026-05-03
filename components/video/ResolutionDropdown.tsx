"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

import { RESOLUTION_OPTIONS } from "@/components/video/model-options";

export function ResolutionDropdown({
  value,
  onChange,
  className,
  label = "Resolution"
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  label?: string;
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

  const selected = RESOLUTION_OPTIONS.find((r) => r.id === value)?.label ?? value;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="zorixa-card-border flex h-9 min-w-[100px] items-center justify-between gap-1 rounded-lg bg-zorixa-preview px-2.5 text-xs text-white"
      >
        <span className="truncate">{selected}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-zorixa-muted", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ originY: 1 }}
            className="absolute bottom-[calc(100%+6px)] left-0 z-[100] min-w-[140px] overflow-hidden rounded-xl border border-[rgba(131,56,235,0.2)] bg-zorixa-dropdown py-1 shadow-glow-lg"
          >
            {RESOLUTION_OPTIONS.map((r) => {
              const active = r.id === value;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onChange(r.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                    active ? "bg-zorixa-selected text-white" : "text-white/95 hover:bg-[rgba(131,56,235,0.1)]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {r.label}
                    {"badge" in r && r.badge === "newTeal" ? <Badge variant="newTeal">NEW</Badge> : null}
                  </span>
                  {active ? <Check className="size-4 shrink-0" /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
