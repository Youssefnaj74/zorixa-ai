"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type GenerationTile = {
  id: string;
  src: string;
  title: string;
};

export function GenerationGrid({ items, className }: { items: GenerationTile[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.35 }}
          className="zorixa-card-border group overflow-hidden rounded-2xl bg-zorixa-card shadow-glow transition-shadow hover:shadow-glow-lg"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={item.src}
              alt={item.title}
              fill
              sizes="(max-width:1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4">
              <p className="truncate font-medium text-white">{item.title}</p>
              <p className="text-xs text-white/60">Zorixa AI</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
