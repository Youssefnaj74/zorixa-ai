"use client";

import { useEffect, useMemo, useState } from "react";

import { VoiceCard, useVoicePreviewController } from "@/components/audio/VoiceCard";
import { FilterPill, VoiceLibraryFilters } from "@/components/audio/VoiceLibraryFilters";
import type { TtsVoice } from "@/lib/tts/types";
import {
  countFeaturedCollections,
  FEATURED_COLLECTIONS,
  filterVoicesByFeaturedCollection,
  type FeaturedCollectionId
} from "@/lib/tts/voice-library/featured-collections";
import {
  filterVoices,
  filterVoicesByCategory,
  groupVoicesByLanguage,
  type VoiceLibraryCategoryTab,
  type VoiceLibraryFacet
} from "@/lib/tts/voice-library/filters";
import { readVoiceFavorites, toggleVoiceFavorite } from "@/lib/tts/voice-library/favorites";
import { pickRecommendedVoices } from "@/lib/tts/voice-library/recommended-voices";
import { cn } from "@/lib/utils";

function VoiceCardGrid({
  voices,
  selectedVoiceId,
  favoriteSet,
  previewVoiceId,
  loadingVoiceId,
  onSelectVoice,
  onToggleFavorite,
  onPreview
}: {
  voices: TtsVoice[];
  selectedVoiceId: string;
  favoriteSet: Set<string>;
  previewVoiceId: string | null;
  loadingVoiceId: string | null;
  onSelectVoice: (voiceId: string) => void;
  onToggleFavorite: (voiceId: string) => void;
  onPreview: (voice: TtsVoice) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {voices.map((voice) => (
        <VoiceCard
          key={voice.voice_id}
          voice={voice}
          selected={voice.voice_id === selectedVoiceId}
          favorite={favoriteSet.has(voice.voice_id)}
          onSelect={() => onSelectVoice(voice.voice_id)}
          onToggleFavorite={() => onToggleFavorite(voice.voice_id)}
          previewing={previewVoiceId === voice.voice_id}
          previewLoading={loadingVoiceId === voice.voice_id}
          onPreview={() => onPreview(voice)}
        />
      ))}
    </div>
  );
}

export function VoiceLibraryPicker({
  voices,
  facets,
  selectedVoiceId,
  onSelectVoice,
  loading,
  warning,
  className,
  variant = "page"
}: {
  voices: TtsVoice[];
  facets: {
    languages: VoiceLibraryFacet[];
    genders: VoiceLibraryFacet[];
    styles: VoiceLibraryFacet[];
  };
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  loading?: boolean;
  warning?: string;
  className?: string;
  variant?: "page" | "modal";
}) {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [gender, setGender] = useState("all");
  const [style, setStyle] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [categoryTab, setCategoryTab] = useState<VoiceLibraryCategoryTab>("all");
  const [featuredCollection, setFeaturedCollection] = useState<FeaturedCollectionId | "all">("all");

  const { previewVoiceId, loadingVoiceId, togglePreview, stopPreview } = useVoicePreviewController();

  useEffect(() => {
    setFavorites(readVoiceFavorites());
  }, []);

  const categoryCounts = useMemo(
    () => ({
      all: voices.length,
      system: voices.filter((v) => v.category === "system").length,
      cloned: voices.filter((v) => v.category === "cloned").length,
      designed: voices.filter((v) => v.category === "designed").length
    }),
    [voices]
  );

  const categoryTabs = useMemo(() => {
    const tabs: { id: VoiceLibraryCategoryTab; label: string }[] = [
      { id: "all", label: "All" },
      { id: "system", label: "Official" },
      { id: "cloned", label: "Cloned" }
    ];
    if (categoryCounts.designed > 0) {
      tabs.push({ id: "designed", label: "Designed" });
    }
    return tabs;
  }, [categoryCounts.designed]);

  useEffect(() => {
    if (categoryTab !== "all" && categoryTab !== "designed" && categoryCounts[categoryTab] === 0) {
      setCategoryTab("all");
    }
    if (categoryTab === "designed" && categoryCounts.designed === 0) {
      setCategoryTab("all");
    }
  }, [categoryTab, categoryCounts]);

  useEffect(() => {
    stopPreview();
  }, [search, language, gender, style, favoritesOnly, categoryTab, featuredCollection, stopPreview]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const categoryVoices = useMemo(
    () => filterVoicesByCategory(voices, categoryTab),
    [voices, categoryTab]
  );

  const featuredCounts = useMemo(() => countFeaturedCollections(categoryVoices), [categoryVoices]);

  const featuredVoices = useMemo(
    () => filterVoicesByFeaturedCollection(categoryVoices, featuredCollection),
    [categoryVoices, featuredCollection]
  );

  const filteredVoices = useMemo(
    () =>
      filterVoices(featuredVoices, {
        search,
        language,
        gender: gender as "all" | "male" | "female" | "neutral" | "child",
        style,
        favoritesOnly,
        favoriteIds: favoriteSet
      }),
    [featuredVoices, search, language, gender, style, favoritesOnly, favoriteSet]
  );

  const isDefaultBrowse =
    featuredCollection === "all" &&
    !search.trim() &&
    language === "all" &&
    gender === "all" &&
    style === "all" &&
    !favoritesOnly;

  const showRecommended =
    isDefaultBrowse && (categoryTab === "all" || categoryTab === "system") && categoryVoices.length > 0;

  const recommendedVoices = useMemo(
    () => (showRecommended ? pickRecommendedVoices(categoryVoices, 8) : []),
    [showRecommended, categoryVoices]
  );

  const groups = useMemo(() => groupVoicesByLanguage(filteredVoices), [filteredVoices]);

  const handleToggleFavorite = (voiceId: string) => {
    setFavorites((prev) => toggleVoiceFavorite(voiceId, prev));
  };

  const clearAllFilters = () => {
    setSearch("");
    setLanguage("all");
    setGender("all");
    setStyle("all");
    setFavoritesOnly(false);
    setCategoryTab("all");
    setFeaturedCollection("all");
  };

  const cardGridProps = {
    selectedVoiceId,
    favoriteSet,
    previewVoiceId,
    loadingVoiceId,
    onSelectVoice,
    onToggleFavorite: handleToggleFavorite,
    onPreview: (voice: TtsVoice) => void togglePreview(voice)
  };

  return (
    <div className={cn("space-y-4", className)}>
      {variant === "page" ? (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">Voice Library</h2>
            <p className="mt-0.5 text-xs text-zorixa-muted">
              Browse MiniMax voices by language, gender, and style.
            </p>
          </div>
          <p className="text-xs tabular-nums text-zorixa-muted">
            {loading ? "Loading voices…" : `${filteredVoices.length} of ${voices.length} voices`}
          </p>
        </div>
      ) : (
        <p className="text-xs tabular-nums text-zorixa-muted">
          {loading ? "Loading voices…" : `${filteredVoices.length} of ${voices.length} voices`}
        </p>
      )}

      {warning ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {warning}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {categoryTabs.map((tab) => (
          <FilterPill
            key={tab.id}
            active={categoryTab === tab.id}
            onClick={() => setCategoryTab(tab.id)}
            count={categoryCounts[tab.id]}
          >
            {tab.label}
          </FilterPill>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">⭐ Featured Voices</p>
        <div className="scrollbar-hide flex flex-wrap gap-2">
          <FilterPill
            active={featuredCollection === "all"}
            onClick={() => setFeaturedCollection("all")}
            count={categoryVoices.length}
          >
            All collections
          </FilterPill>
          {FEATURED_COLLECTIONS.map((collection) => (
            <FilterPill
              key={collection.id}
              active={featuredCollection === collection.id}
              onClick={() => setFeaturedCollection(collection.id)}
              count={featuredCounts[collection.id]}
            >
              {collection.emoji} {collection.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <VoiceLibraryFilters
        search={search}
        onSearchChange={setSearch}
        language={language}
        onLanguageChange={setLanguage}
        gender={gender}
        onGenderChange={setGender}
        style={style}
        onStyleChange={setStyle}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyChange={setFavoritesOnly}
        favoriteCount={favorites.length}
        facets={facets}
      />

      {filteredVoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
          <p className="text-sm text-white/70">No voices match your filters.</p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-3 text-xs font-semibold text-[#00e5ff] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {showRecommended && recommendedVoices.length > 0 ? (
            <section className="space-y-3">
              <header className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-base" aria-hidden>
                  ⭐
                </span>
                <h3 className="text-sm font-semibold text-white">Recommended for you</h3>
                <span className="text-xs tabular-nums text-zorixa-muted">
                  ({recommendedVoices.length})
                </span>
              </header>
              <VoiceCardGrid voices={recommendedVoices} {...cardGridProps} />
            </section>
          ) : null}

          <section className="space-y-6">
            <header className="flex items-center gap-2 border-b border-white/10 pb-2">
              <h3 className="text-sm font-semibold text-white">All voices</h3>
              <span className="text-xs tabular-nums text-zorixa-muted">({filteredVoices.length})</span>
            </header>

            {groups.map((group) => (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden>
                    {group.flag}
                  </span>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    {group.label}
                  </h4>
                  <span className="text-xs tabular-nums text-zorixa-muted">({group.voices.length})</span>
                </div>
                <VoiceCardGrid voices={group.voices} {...cardGridProps} />
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
