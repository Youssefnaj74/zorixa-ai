"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const pillBase =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#8338eb]/50";

export function FilterPill({
  active,
  onClick,
  children,
  count
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        pillBase,
        active
          ? "border-[#8338eb]/50 bg-[#8338eb]/20 text-white"
          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
      )}
    >
      {children}
      {typeof count === "number" ? (
        <span className={cn("tabular-nums", active ? "text-white/80" : "text-white/40")}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function VoiceLibraryFilters({
  search,
  onSearchChange,
  language,
  onLanguageChange,
  gender,
  onGenderChange,
  style,
  onStyleChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  favoriteCount,
  facets
}: {
  search: string;
  onSearchChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  gender: string;
  onGenderChange: (value: string) => void;
  style: string;
  onStyleChange: (value: string) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  favoriteCount: number;
  facets: {
    languages: { id: string; label: string; flag?: string; count: number }[];
    genders: { id: string; label: string; count: number }[];
    styles: { id: string; label: string; count: number }[];
  };
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40"
          aria-hidden
        >
          🔍
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by voice name…"
          className="w-full rounded-xl border border-white/10 bg-zorixa-preview py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-[#8338eb]/50 focus:outline-none focus:ring-1 focus:ring-[#8338eb]/40"
        />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Quick filters</p>
        <div className="scrollbar-hide flex flex-wrap gap-2">
          <FilterPill active={!favoritesOnly && language === "all" && gender === "all" && style === "all" && !search.trim()} onClick={() => {
            onFavoritesOnlyChange(false);
            onLanguageChange("all");
            onGenderChange("all");
            onStyleChange("all");
            onSearchChange("");
          }}>
            All
          </FilterPill>
          <FilterPill
            active={favoritesOnly}
            onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
            count={favoriteCount}
          >
            ★ Favorites
          </FilterPill>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Language</p>
        <div className="scrollbar-hide flex flex-wrap gap-2">
          <FilterPill active={language === "all"} onClick={() => onLanguageChange("all")}>
            All
          </FilterPill>
          {facets.languages.map((item) => (
            <FilterPill
              key={item.id}
              active={language === item.id}
              onClick={() => onLanguageChange(item.id)}
              count={item.count}
            >
              {item.flag ? <span aria-hidden>{item.flag}</span> : null}
              {item.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Gender</p>
        <div className="scrollbar-hide flex flex-wrap gap-2">
          <FilterPill active={gender === "all"} onClick={() => onGenderChange("all")}>
            All
          </FilterPill>
          {facets.genders.map((item) => (
            <FilterPill
              key={item.id}
              active={gender === item.id}
              onClick={() => onGenderChange(item.id)}
              count={item.count}
            >
              {item.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Style</p>
        <div className="scrollbar-hide flex flex-wrap gap-2">
          <FilterPill active={style === "all"} onClick={() => onStyleChange("all")}>
            All
          </FilterPill>
          {facets.styles.map((item) => (
            <FilterPill
              key={item.id}
              active={style === item.id}
              onClick={() => onStyleChange(item.id)}
              count={item.count}
            >
              {item.label}
            </FilterPill>
          ))}
        </div>
      </div>
    </div>
  );
}
