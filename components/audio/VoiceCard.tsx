"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Pause, Play, Star } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import type { TtsVoice } from "@/lib/tts/types";
import { genderLabel } from "@/lib/tts/voice-library/metadata";
import { cn } from "@/lib/utils";

function ProviderBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00e5ff]">
      MiniMax
    </span>
  );
}

function QualityBadge({ quality }: { quality?: "HD" | "Turbo" }) {
  return (
    <Badge variant="pro" className="bg-[#8338eb]/80">
      {quality ?? "HD"}
    </Badge>
  );
}

export function VoiceCard({
  voice,
  selected,
  favorite,
  onSelect,
  onToggleFavorite,
  previewing,
  previewLoading,
  onPreview
}: {
  voice: TtsVoice;
  selected: boolean;
  favorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  previewing: boolean;
  previewLoading: boolean;
  onPreview: () => void;
}) {
  const flag = voice.labels?.languageFlag ?? "🌐";
  const language = voice.labels?.languageLabel ?? "Voice";
  const gender = genderLabel(voice.labels?.gender);
  const style = voice.labels?.style ?? "General";

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-3 transition-colors sm:p-3.5",
        selected
          ? "border-[#8338eb]/60 bg-[#8338eb]/10 shadow-[0_0_0_1px_rgba(131,56,235,0.2)]"
          : "border-white/10 bg-zorixa-preview/60 hover:border-white/20 hover:bg-white/[0.04]"
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-left"
          aria-pressed={selected}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none" aria-hidden>
              {flag}
            </span>
            <h3 className="truncate text-sm font-semibold text-white">{voice.name}</h3>
            {selected ? (
              <Check className="size-4 shrink-0 text-[#00e5ff]" aria-label="Selected" />
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs text-zorixa-muted">
            {language} · {gender} · {style}
          </p>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
            favorite
              ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
              : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70"
          )}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("size-4", favorite && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <ProviderBadge />
        <QualityBadge quality={voice.quality} />
        {voice.category && voice.category !== "system" ? (
          <Badge variant="newTeal">{voice.category}</Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          disabled={previewLoading && !previewing}
          className={cn(
            "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-colors",
            previewing
              ? "border-[#00e5ff]/40 bg-[#00e5ff]/15 text-[#00e5ff]"
              : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white",
            previewLoading && !previewing && "opacity-60"
          )}
        >
          {previewLoading && !previewing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : previewing ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5" />
          )}
          {previewing ? "Stop preview" : previewLoading ? "Loading…" : "Preview"}
        </button>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold transition-colors",
            selected
              ? "bg-gradient-to-r from-[#8338eb] to-[#00e5ff] text-black"
              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
          )}
        >
          {selected ? "Selected" : "Use voice"}
        </button>
      </div>
    </article>
  );
}

/** Manages one-at-a-time voice preview playback across cards. */
export function useVoicePreviewController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const stopPreview = useCallback(() => {
    audioRef.current?.pause();
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    audioRef.current = null;
    setPreviewVoiceId(null);
    setLoadingVoiceId(null);
  }, []);

  useEffect(() => () => stopPreview(), [stopPreview]);

  const togglePreview = useCallback(
    async (voice: TtsVoice) => {
      if (previewVoiceId === voice.voice_id) {
        stopPreview();
        return;
      }

      stopPreview();
      setLoadingVoiceId(voice.voice_id);

      try {
        const previewUrl = voice.preview_url ?? `/api/tts/voice-preview?voice_id=${encodeURIComponent(voice.voice_id)}`;
        const res = await fetch(previewUrl);
        if (!res.ok) throw new Error("Preview failed");

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;

        const audio = new Audio(blobUrl);
        audioRef.current = audio;
        audio.onended = () => stopPreview();
        audio.onerror = () => stopPreview();

        await audio.play();
        setPreviewVoiceId(voice.voice_id);
      } catch {
        stopPreview();
      } finally {
        setLoadingVoiceId(null);
      }
    },
    [previewVoiceId, stopPreview]
  );

  return {
    previewVoiceId,
    loadingVoiceId,
    togglePreview,
    stopPreview
  };
}
