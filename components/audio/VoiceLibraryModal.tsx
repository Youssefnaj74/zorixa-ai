"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { VoiceLibraryPicker } from "@/components/audio/VoiceLibraryPicker";
import type { TtsVoice } from "@/lib/tts/types";
import type { VoiceLibraryFacet } from "@/lib/tts/voice-library/filters";
import { cn } from "@/lib/utils";

export function VoiceLibraryModal({
  open,
  onClose,
  voices,
  facets,
  selectedVoiceId,
  onSelectVoice,
  loading,
  warning
}: {
  open: boolean;
  onClose: () => void;
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
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (voiceId: string) => {
    onSelectVoice(voiceId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-label="Close voice library"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-library-title"
        className={cn(
          "relative flex w-full flex-col bg-zorixa-card shadow-2xl",
          "h-[100dvh] rounded-none border-white/10 sm:h-auto sm:max-h-[min(88vh,900px)] sm:max-w-4xl sm:rounded-2xl sm:border"
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 id="voice-library-title" className="font-display text-base font-semibold text-white sm:text-lg">
              Voice Library
            </h2>
            <p className="mt-0.5 truncate text-xs text-zorixa-muted">
              Search, filter, and preview MiniMax voices
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          <VoiceLibraryPicker
            variant="modal"
            voices={voices}
            facets={facets}
            selectedVoiceId={selectedVoiceId}
            onSelectVoice={handleSelect}
            loading={loading}
            warning={warning}
          />
        </div>
      </div>
    </div>
  );
}
