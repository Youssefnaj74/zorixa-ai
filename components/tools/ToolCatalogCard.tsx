"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Clapperboard,
  Coins,
  Film,
  Images,
  Mic2,
  Pencil,
  Sparkles,
  Wand2
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import type { ToolCatalogItem, ToolCatalogSectionId } from "@/lib/tools-catalog";
import { cn } from "@/lib/utils";

const SECTION_ICONS: Record<ToolCatalogSectionId, LucideIcon> = {
  "text-to-image": Sparkles,
  "image-to-image": Images,
  "image-editing": Pencil,
  "text-to-video": Clapperboard,
  "image-to-video": Film,
  "reference-to-video": Wand2,
  "video-to-video": Mic2
};

export function ToolCatalogCard({ item }: { item: ToolCatalogItem }) {
  const Icon = SECTION_ICONS[item.sectionId];

  return (
    <Link
      href={item.href}
      className={cn(
        "group zorixa-card-border flex flex-col overflow-hidden rounded-xl bg-zorixa-card shadow-glow",
        "transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(131,56,235,0.22)]",
        !item.wired && "pointer-events-none opacity-50"
      )}
    >
      <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-zorixa-bg-secondary">
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-dark/90 via-brand/40 to-zorixa-bg-secondary"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" aria-hidden />
        <span className="relative grid size-12 place-items-center rounded-xl border border-[rgba(131,56,235,0.25)] bg-[#1a1a24]/80 text-brand shadow-[0_0_20px_rgba(131,56,235,0.2)] backdrop-blur-sm transition-transform duration-200 group-hover:scale-105">
          <Icon className="size-6 text-white" strokeWidth={1.75} aria-hidden />
        </span>
        {item.badge ? (
          <span className="absolute right-2 top-2">
            {item.badge === "PRO" ? (
              <Badge variant="pro">PRO</Badge>
            ) : (
              <Badge variant="newTeal">NEW</Badge>
            )}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-[rgba(131,56,235,0.12)] p-3">
        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-white">
          {item.title}
        </h3>
        {item.subtitle ? (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-zorixa-muted">{item.subtitle}</p>
        ) : null}
        <p className="mt-auto flex items-center gap-1.5 pt-1.5 text-[11px] text-zorixa-muted">
          <Coins className="size-3.5 shrink-0 text-brand/80" aria-hidden />
          <span>{item.creditsLabel}</span>
        </p>
      </div>
    </Link>
  );
}
