"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { PublicFaqItem } from "@/data/public-faq";
import { cn } from "@/lib/utils";

export function PublicFaqList({ items }: { items: PublicFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-white/90 transition hover:text-white"
              aria-expanded={open}
            >
              {item.q}
              <ChevronDown
                className={cn("size-4 shrink-0 text-white/40 transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
            {open ? <p className="px-5 pb-4 text-sm leading-relaxed text-white/60">{item.a}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
