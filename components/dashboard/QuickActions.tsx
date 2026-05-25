"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ImageIcon, LayoutGrid } from "lucide-react";

import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    href: "/image",
    label: "Image studio",
    description: "Atlas models · generate & edit",
    icon: ImageIcon,
    accent: "from-emerald-500/25 to-teal-600/10"
  },
  {
    href: "/dashboard/history",
    label: "History",
    description: "All your outputs",
    icon: LayoutGrid,
    accent: "from-amber-500/20 to-orange-600/10"
  }
] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }
};

export function QuickActions({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("grid gap-3 sm:grid-cols-2", className)}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-32px" }}
    >
      {ACTIONS.map(({ href, label, description, icon: Icon, accent }) => (
        <motion.div key={href} variants={item} className="h-full">
          <Link href={href} className="group block h-full rounded-2xl">
            <motion.div
              className={cn(
                "relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.06] p-4 shadow-[0_8px_28px_rgba(0,0,0,0.3)] backdrop-blur-xl",
                "transition-colors duration-300 hover:border-violet-400/25"
              )}
              whileHover={{ y: -4, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
              whileTap={{ scale: 0.99 }}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  accent
                )}
              />
              <div className="relative flex items-start justify-between gap-2">
                <motion.span
                  className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/[0.08] text-white shadow-inner"
                  whileHover={{ rotate: -6, scale: 1.04 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                >
                  <Icon className="size-5 text-violet-200" aria-hidden />
                </motion.span>
                <ArrowUpRight className="size-4 shrink-0 text-white/35 transition-colors group-hover:text-violet-300" />
              </div>
              <div className="relative">
                <p className="font-display text-sm font-semibold text-white">{label}</p>
                <p className="mt-0.5 text-xs text-white/45">{description}</p>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
