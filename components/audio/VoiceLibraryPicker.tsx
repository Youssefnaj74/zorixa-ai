"use client";

import { useEffect, useMemo, useState } from "react";

import { VoiceCard, useVoicePreviewController } from "@/components/audio/VoiceCard";
import { VoiceLibraryFilters } from "@/components/audio/VoiceLibraryFilters";
import type { TtsVoice } from "@/lib/tts/types";
import {
  filterVoices,
  groupVoicesByLanguage,
  type VoiceLibraryFacet
} from "@/lib/tts/voice-library/filters";
import { readVoiceFavorites, toggleVoiceFavorite } from "@/lib/tts/voice-library/favorites";
import { cn } from "@/lib/utils";

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
  /** `modal` hides the page-level header (shown in VoiceLibraryModal instead). */
  variant?: "page" | "modal";
}) {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [gender, setGender] = useState("all");
  const [style, setStyle] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const { previewVoiceId, loadingVoiceId, togglePreview, stopPreview } = useVoicePreviewController();

  useEffect(() => {
    setFavorites(readVoiceFavorites());
  }, []);

  useEffect(() => {
    stopPreview();
  }, [search, language, gender, style, favoritesOnly, stopPreview]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const filteredVoices = useMemo(
    () =>
      filterVoices(voices, {
        search,
        language,
        gender: gender as "all" | "male" | "female" | "neutral" | "child",
        style,
        favoritesOnly,
        favoriteIds: favoriteSet
      }),
    [voices, search, language, gender, style, favoritesOnly, favoriteSet]
  );

  const groups = useMemo(() => groupVoicesByLanguage(filteredVoices), [filteredVoices]);

  const handleToggleFavorite = (voiceId: string) => {
    setFavorites((prev) => toggleVoiceFavorite(voiceId, prev));
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
            onClick={() => {
              setSearch("");
              setLanguage("all");
              setGender("all");
              setStyle("all");
              setFavoritesOnly(false);
            }}
            className="mt-3 text-xs font-semibold text-[#00e5ff] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.id} className="space-y-3">
              <header className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-base" aria-hidden>
                  {group.flag}
                </span>
                <h3 className="text-sm font-semibold text-white">{group.label}</h3>
                <span className="text-xs tabular-nums text-zorixa-muted">({group.voices.length})</span>
              </header>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.voices.map((voice) => (
                  <VoiceCard
                    key={voice.voice_id}
                    voice={voice}
                    selected={voice.voice_id === selectedVoiceId}
                    favorite={favoriteSet.has(voice.voice_id)}
                    onSelect={() => onSelectVoice(voice.voice_id)}
                    onToggleFavorite={() => handleToggleFavorite(voice.voice_id)}
                    previewing={previewVoiceId === voice.voice_id}
                    previewLoading={loadingVoiceId === voice.voice_id}
                    onPreview={() => void togglePreview(voice)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
