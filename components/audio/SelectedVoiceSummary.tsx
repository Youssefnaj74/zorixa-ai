"use client";

import { Loader2, Mic, Pause, Play, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import type { TtsVoice } from "@/lib/tts/types";
import { cn } from "@/lib/utils";

export function SelectedVoiceSummary({
  voice,
  loading,
  previewing,
  previewLoading,
  onChangeVoice,
  onPreview
}: {
  voice: TtsVoice | undefined;
  loading?: boolean;
  previewing?: boolean;
  previewLoading?: boolean;
  onChangeVoice: () => void;
  onPreview?: () => void;
}) {
  if (loading && !voice) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zorixa-preview/40 px-4 py-3.5">
        <div className="flex size-12 items-center justify-center rounded-xl bg-white/5">
          <Loader2 className="size-5 animate-spin text-zorixa-muted" />
        </div>
        <span className="text-sm text-zorixa-muted">Loading voices…</span>
      </div>
    );
  }

  if (!voice) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/30">
            <Mic className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white/80">No voice selected</p>
            <p className="mt-0.5 text-xs text-zorixa-muted">Pick a voice from the library to continue.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onChangeVoice}
            className="h-9 shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10"
          >
            Change voice
          </Button>
        </div>
      </div>
    );
  }

  const flag = voice.labels?.languageFlag ?? "🌐";
  const language = voice.labels?.languageLabel ?? "Multilingual";
  const style = voice.labels?.style ?? "General";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border p-3.5 sm:p-4",
        "border-[#8338eb]/30 bg-gradient-to-br from-[#8338eb]/12 via-zorixa-preview/90 to-[#00e5ff]/8",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-[#00e5ff]/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#8338eb]/25 to-[#00e5ff]/15 text-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] sm:size-14"
            aria-hidden
          >
            {flag}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00e5ff]/80">
              Selected voice
            </p>
            <h3 className="mt-0.5 truncate font-display text-base font-semibold text-white sm:text-lg">
              {voice.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zorixa-muted">
              <span className="inline-flex items-center gap-1">
                <span className="text-white/40">Language</span>
                <span className="font-medium text-white/90">{language}</span>
              </span>
              <span className="text-white/20" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="text-white/40">Style</span>
                <span className="font-medium text-white/90">{style}</span>
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-[#00e5ff]/35 bg-[#00e5ff]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00e5ff]">
                MiniMax
              </span>
              <Badge variant="pro" className="bg-[#8338eb]/85">
                {voice.quality ?? "HD"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
          {onPreview ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onPreview}
              disabled={previewLoading && !previewing}
              className={cn(
                "h-9 flex-1 rounded-lg border px-3 text-xs font-semibold sm:flex-none sm:min-w-[7.5rem]",
                previewing
                  ? "border-[#00e5ff]/40 bg-[#00e5ff]/15 text-[#00e5ff] hover:bg-[#00e5ff]/20"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                previewLoading && !previewing && "opacity-60"
              )}
            >
              {previewLoading && !previewing ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : previewing ? (
                <Pause className="mr-1.5 size-3.5" />
              ) : (
                <Play className="mr-1.5 size-3.5" />
              )}
              {previewing ? "Stop" : "Preview"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={onChangeVoice}
            className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10 sm:flex-none sm:min-w-[7.5rem]"
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            Change voice
          </Button>
        </div>
      </div>
    </article>
  );
}
