"use client";

import Link from "next/link";
import { Clapperboard, ImageIcon, LayoutGrid, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const ACTIONS = [
  { href: "/image", label: "Generate Image", icon: ImageIcon },
  { href: "/video", label: "Generate Video", icon: Clapperboard },
  { href: "/dashboard/enhance", label: "Upscale", icon: Sparkles },
  { href: "/dashboard/history", label: "Gallery", icon: LayoutGrid }
] as const;

export function QuickActions({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {ACTIONS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="zorixa-card-border group flex items-center gap-3 rounded-2xl bg-zorixa-card p-4 shadow-glow transition-all hover:shadow-glow-lg"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-brand/15 text-brand-light ring-1 ring-brand/30 transition-transform group-hover:scale-105">
            <Icon className="size-5" />
          </span>
          <span className="font-display text-sm font-semibold text-white">{label}</span>
        </Link>
      ))}
    </div>
  );
}
