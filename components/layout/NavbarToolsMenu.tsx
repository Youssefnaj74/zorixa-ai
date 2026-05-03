"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
  ALL_TOOLS,
  distributeToolsToColumns,
  type CategoryFilter,
  type ToolMenuItem,
  toolMatchesCategory,
  toolMatchesSearch
} from "@/components/layout/tools-menu-data";

const CATEGORY_PILLS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "video", label: "Video" },
  { id: "image", label: "Image" },
  { id: "audio", label: "Audio" },
  { id: "animation", label: "Animation" },
  { id: "ai-tools", label: "AI Tools" }
];

function countForCategory(filter: CategoryFilter): number {
  if (filter === "all") return ALL_TOOLS.length;
  return ALL_TOOLS.filter((t) => t.categories.includes(filter)).length;
}

function ToolRow({
  tool,
  selected,
  onNavigate
}: {
  tool: ToolMenuItem;
  selected: boolean;
  onNavigate: (href: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(tool.href)}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-left transition-colors",
        "bg-transparent hover:bg-[rgba(131,56,235,0.08)]",
        selected &&
          "border-[rgba(131,56,235,0.3)] bg-[rgba(131,56,235,0.15)] hover:bg-[rgba(131,56,235,0.18)]"
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg bg-[#1a1a2e] text-base leading-none text-[#9b7dff]",
          selected && "bg-[#8338eb] text-white"
        )}
        aria-hidden
      >
        {tool.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1">
          <span className="text-[13px] font-semibold text-white">{tool.title}</span>
          {tool.isNew ? (
            <span className="ml-1.5 rounded px-1.5 py-px text-[10px] font-semibold text-white" style={{ background: "#0d9488" }}>
              NEW
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-[#6b7280]">{tool.subtitle}</span>
      </span>
    </button>
  );
}

export function NavbarToolsMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const pathname = usePathname();
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const videoGeneratorActive = pathname === "/video" || pathname.startsWith("/video/");

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter(
      (tool) => toolMatchesCategory(tool, category) && toolMatchesSearch(tool, search)
    );
  }, [category, search]);

  const filterKey = `${category}-${search}`;

  const gridColumns = useMemo(
    () => distributeToolsToColumns(filteredTools, 4),
    [filteredTools]
  );

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
    },
    [router]
  );

  useEffect(() => {
    if (!open) {
      setSearch("");
      setCategory("all");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "relative flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
          open ? "text-white" : "text-zorixa-muted hover:text-white"
        )}
      >
        <span>Tools</span>
        <span className="inline-block size-2 shrink-0 rounded-full bg-[#ef4444]" aria-hidden />
        {open ? (
          <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-brand/90 to-brand" aria-hidden />
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="zorixa-tools-mega"
            ref={panelRef}
            role="dialog"
            aria-label="Tools menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 z-[60] w-screen border-b border-l border-r border-[rgba(131,56,235,0.15)] bg-[#111118] px-8 py-6 shadow-[0_24px_48px_rgba(0,0,0,0.45)]"
            style={{ top: "56px" }}
          >
            <div className="mx-auto max-w-[1920px]">
              {/* Search */}
              <div className="relative mb-4 w-full">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[#6b7280]" aria-hidden>
                  🔍
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tools..."
                  className="w-full rounded-[10px] border border-[rgba(131,56,235,0.3)] bg-[#1a1a2e] py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-[#6b7280] outline-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-brand/40"
                  autoComplete="off"
                />
              </div>

              {/* Categories */}
              <div className="scrollbar-hide mb-5 flex gap-2 overflow-x-auto pb-1">
                {CATEGORY_PILLS.map((pill) => {
                  const active = category === pill.id;
                  const count = countForCategory(pill.id);
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setCategory(pill.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors duration-200",
                        active
                          ? "border-[#8338eb] bg-[#8338eb] text-white"
                          : "border-[rgba(255,255,255,0.08)] bg-[#1a1a2e] text-[#6b7280] hover:bg-[rgba(131,56,235,0.15)] hover:text-white"
                      )}
                    >
                      {pill.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Grid */}
              {filteredTools.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#6b7280]">No tools found</p>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={filterKey}
                    role="list"
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    {gridColumns.map((column, colIndex) => (
                      <div key={`${filterKey}-col-${colIndex}`} className="flex min-w-0 flex-col gap-2">
                        {column.map((tool) => (
                          <ToolRow
                            key={tool.id}
                            tool={tool}
                            selected={tool.id === "video-generator" && videoGeneratorActive}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
