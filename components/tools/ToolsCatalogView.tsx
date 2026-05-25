"use client";

import { useEffect, useMemo, useState } from "react";

import { ToolCatalogCard } from "@/components/tools/ToolCatalogCard";
import { TOOLS_CATALOG_SECTIONS, type ToolCatalogSectionId } from "@/lib/tools-catalog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const FILTER_PILLS: { id: "all" | ToolCatalogSectionId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "text-to-image", label: "Text to Image" },
  { id: "image-to-image", label: "Image to Image" },
  { id: "text-to-video", label: "Text to Video" },
  { id: "image-to-video", label: "Image to Video" },
  { id: "reference-to-video", label: "Reference to Video" },
  { id: "video-to-video", label: "Video to Video" },
  { id: "character-swap", label: "Character Swap" },
  { id: "audio-to-video", label: "Audio to Video" }
];

const triggerClass =
  "inline-flex h-9 shrink-0 items-center rounded-lg border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] px-3 text-xs font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand";

export function ToolsCatalogView() {
  const [filter, setFilter] = useState<"all" | ToolCatalogSectionId>("all");
  const [latestImageByTool, setLatestImageByTool] = useState<Record<string, string>>({});

  const sections = useMemo(() => {
    if (filter === "all") return TOOLS_CATALOG_SECTIONS;
    return TOOLS_CATALOG_SECTIONS.filter((s) => s.id === filter);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestGeneratedPreviews() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("generations")
        .select("composer_model_id, input_url, output_url")
        .eq("feature_type", "image")
        .eq("status", "completed")
        .not("output_url", "is", null)
        .not("composer_model_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (cancelled || !data) return;

      const next: Record<string, string> = {};
      for (const row of data as { composer_model_id: string | null; input_url: string | null; output_url: string | null }[]) {
        const model = row.composer_model_id?.trim();
        const url = row.output_url?.trim();
        const input = row.input_url?.trim() ?? "";
        const section = input.includes("placehold.co") ? "text-to-image" : "image-to-image";
        if (model && url && !next[`${section}-${model}`]) next[`${section}-${model}`] = url;
      }
      setLatestImageByTool(next);
    }

    void loadLatestGeneratedPreviews();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Tools</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zorixa-muted">
          Atlas Cloud models in Zorixa — open Image or Video studio from any card. Credits per model
          coming soon.
        </p>
      </header>

      <div className="scrollbar-hide mb-8 flex flex-wrap gap-2">
        {FILTER_PILLS.map((pill) => {
          const active = filter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              className={cn(
                triggerClass,
                active && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.12)] text-white"
              )}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-10">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`tools-section-${section.id}`}>
            <h2
              id={`tools-section-${section.id}`}
              className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zorixa-muted"
            >
              <span
                className="size-1.5 shrink-0 rounded-full bg-brand shadow-[0_0_8px_rgba(131,56,235,0.6)]"
                aria-hidden
              />
              <span className="text-white/80">{section.title}</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {section.items.map((item) => (
                <ToolCatalogCard
                  key={item.id}
                  item={item}
                  generatedPreviewUrl={latestImageByTool[`${item.sectionId}-${item.composerModelId}`]}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
