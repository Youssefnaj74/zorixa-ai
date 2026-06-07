"use client";

import { Mic2 } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const BAR_HEIGHTS = [0.3, 0.55, 0.85, 0.45, 0.95, 0.5, 0.75, 0.4, 0.9, 0.35, 0.8, 0.6, 0.7, 0.45, 0.88, 0.5];

export function AudioUploadSlotContent({
  loaded,
  className
}: {
  loaded: boolean;
  className?: string;
}) {
  if (!loaded) {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <Mic2 className="size-5 opacity-60" />
        <span className="mt-2 text-center text-xs font-medium text-zorixa-muted">Audio</span>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col items-center justify-center gap-1.5 px-1", className)}>
      <div className="flex h-10 w-full max-w-[130px] items-end justify-center gap-[2px]" aria-hidden>
        {BAR_HEIGHTS.map((h, i) => (
          <motion.span
            key={i}
            className="block h-full w-[3px] shrink-0 origin-bottom rounded-full bg-gradient-to-t from-[#8338eb] to-[#00e5ff] shadow-[0_0_6px_rgba(0,229,255,0.35)]"
            initial={{ scaleY: h * 0.6 }}
            animate={{
              scaleY: [h * 0.35, h, h * 0.55, h * 0.92, h * 0.4, h * 0.78, h * 0.35]
            }}
            transition={{
              duration: 0.85 + (i % 5) * 0.12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.04
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00e5ff]/90">
        Audio
      </span>
    </div>
  );
}

export function audioUploadSlotClass(loaded: boolean) {
  return cn(
    "relative flex h-[88px] w-[150px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl transition-colors",
    loaded
      ? "border border-solid border-[#00e5ff]/45 bg-[#00e5ff]/[0.06] shadow-[inset_0_0_24px_rgba(0,229,255,0.08)]"
      : "border border-dashed border-white/20 bg-black/40 text-zorixa-muted hover:border-white/30 hover:bg-black/55"
  );
}
