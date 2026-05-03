"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Clapperboard,
  Droplets,
  ImageIcon,
  Palette,
  ScanFace,
  Sparkles,
  Wand2,
  Zap
} from "lucide-react";

import { ToolCard, type ToolBadge } from "@/components/dashboard/ToolCard";
import { cn } from "@/lib/utils";

type TabId = "all" | "image" | "video";

type ToolEntry = {
  name: string;
  description: string;
  icon: LucideIcon;
  category: "image" | "video";
  badges?: ToolBadge[];
};

const TOOLS: ToolEntry[] = [
  {
    name: "GPT Image 2",
    description: "Instruction-tuned image generation with crisp UI exports.",
    icon: Sparkles,
    category: "image",
    badges: [{ kind: "promo", label: "NEW", variant: "accent" }]
  },
  {
    name: "Nano Banana 2",
    description: "Fast stylistic edits with playful composition controls.",
    icon: Zap,
    category: "image",
    badges: [{ kind: "promo", label: "HOT", variant: "accent" }]
  },
  {
    name: "Skin Editor",
    description: "Portrait cleanup with natural texture preservation.",
    icon: Droplets,
    category: "image"
  },
  {
    name: "Image Editor",
    description: "Layer-aware edits for campaigns and product shots.",
    icon: Palette,
    category: "image",
    badges: [{ kind: "promo", label: "POPULAR", variant: "accent" }]
  },
  {
    name: "Kora Reality",
    description: "Narrative clips from reference frames with motion cues.",
    icon: Clapperboard,
    category: "video",
    badges: [{ kind: "promo", label: "NEW", variant: "accent" }]
  },
  {
    name: "Face Swap",
    description: "Identity-aware swaps with blend controls.",
    icon: ScanFace,
    category: "image"
  },
  {
    name: "Retouch",
    description: "Remove blemishes and sensor noise without plastic skin.",
    icon: Wand2,
    category: "image"
  },
  {
    name: "Image Upscaler",
    description: "Sharpen edges and recover detail at higher resolutions.",
    icon: ImageIcon,
    category: "image",
    badges: [{ kind: "off", percent: 20 }]
  },
  {
    name: "Seedream 5 Lite",
    description: "Lightweight diffusion passes for rapid iterations.",
    icon: Sparkles,
    category: "image"
  }
];

const tabs: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" }
];

export function DashboardStudioTools() {
  const [tab, setTab] = useState<TabId>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return TOOLS;
    return TOOLS.filter((t) => t.category === tab);
  }, [tab]);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-heading text-xs font-semibold uppercase tracking-widest text-white/50">
          Studio Tools
        </p>
        <div className="flex rounded-full border border-surface-border bg-surface-elevated p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-4 py-1.5 font-heading text-xs font-semibold transition-colors",
                tab === t.id ? "bg-brand text-white" : "text-white/50 hover:text-white/80"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((tool) => (
          <ToolCard
            key={tool.name}
            name={tool.name}
            description={tool.description}
            icon={tool.icon}
            badges={tool.badges}
          />
        ))}
      </div>
    </section>
  );
}
