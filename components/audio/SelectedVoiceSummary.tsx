"use client";

import type { ReactNode } from "react";
import { Loader2, Mic, Pause, Play, RefreshCw, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TtsVoice } from "@/lib/tts/types";
import {
  TTS_SPEECH_MODEL_OPTIONS,
  minimaxTtsModelLabel,
  type TtsSpeechModelId
} from "@/lib/tts/providers/minimax/constants";
import { formatTtsModelCreditHint } from "@/lib/tts/pricing";
import {
  TTS_SPEED_DEFAULT,
  TTS_SPEED_MAX,
  TTS_SPEED_MIN,
  TTS_SPEED_STEP,
  clampTtsSpeed,
  formatTtsSpeedLabel
} from "@/lib/tts/constants";
import { cn } from "@/lib/utils";

function PanelRow({
  emoji,
  label,
  children
}: {
  emoji: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-white/45">
        <span aria-hidden className="mr-1">
          {emoji}
        </span>
        {label}
      </p>
      <div className="text-sm leading-snug text-white">{children}</div>
    </div>
  );
}

function SpeechModelPicker({
  modelId,
  characterCount,
  onModelChange
}: {
  modelId: TtsSpeechModelId;
  characterCount: number;
  onModelChange: (modelId: TtsSpeechModelId) => void;
}) {
  const activeOption = TTS_SPEECH_MODEL_OPTIONS.find((option) => option.id === modelId);

  return (
    <div className="space-y-1.5">
      <div
        className="flex rounded-lg bg-white/[0.04] p-0.5"
        role="radiogroup"
        aria-label="Speech model quality"
      >
        {TTS_SPEECH_MODEL_OPTIONS.map((option) => {
          const active = option.id === modelId;
          const creditHint = formatTtsModelCreditHint(characterCount, option.id);
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onModelChange(option.id)}
              className={cn(
                "flex flex-1 flex-col items-center rounded-md px-2 py-1.5 transition-colors",
                active
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              <span className="text-xs font-semibold">{option.label}</span>
              <span
                className={cn(
                  "mt-0.5 text-[10px] tabular-nums",
                  active ? "text-[#00e5ff]/80" : "text-white/35"
                )}
              >
                {creditHint}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] leading-snug text-zorixa-muted">
        {minimaxTtsModelLabel(modelId)}
        {activeOption ? (
          <span className="text-white/25"> · </span>
        ) : null}
        {activeOption?.description}
      </p>
    </div>
  );
}

function SpeechSpeedSlider({
  speed,
  onSpeedChange
}: {
  speed: number;
  onSpeedChange: (speed: number) => void;
}) {
  const value = clampTtsSpeed(speed);
  const fillPct =
    ((value - TTS_SPEED_MIN) / (TTS_SPEED_MAX - TTS_SPEED_MIN)) * 100;
  const fill = `linear-gradient(to right, #8338eb 0%, #8338eb ${fillPct}%, rgba(255,255,255,0.06) ${fillPct}%, rgba(255,255,255,0.06) 100%)`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-zorixa-muted">Slower</span>
        <span className="text-xs font-semibold tabular-nums text-[#00e5ff]/90">
          {formatTtsSpeedLabel(value)}
        </span>
        <span className="text-[11px] text-zorixa-muted">Faster</span>
      </div>
      <input
        type="range"
        min={TTS_SPEED_MIN}
        max={TTS_SPEED_MAX}
        step={TTS_SPEED_STEP}
        value={value}
        onChange={(e) => onSpeedChange(clampTtsSpeed(Number(e.target.value)))}
        aria-label="Speech speed"
        className={cn(
          "h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none",
          "[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#8338eb]",
          "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#8338eb]"
        )}
        style={{ background: fill }}
      />
      {value !== TTS_SPEED_DEFAULT ? (
        <button
          type="button"
          onClick={() => onSpeedChange(TTS_SPEED_DEFAULT)}
          className="text-[11px] font-medium text-white/45 hover:text-white/70"
        >
          Reset to 1x
        </button>
      ) : null}
    </div>
  );
}

function ControlPanelBody({
  voice,
  loading,
  modelId,
  characterCount,
  onModelChange,
  speed,
  onSpeedChange,
  creditsLine,
  previewing,
  previewLoading,
  generating,
  canGenerate,
  onChangeVoice,
  onPreview,
  onGenerate
}: {
  voice: TtsVoice | undefined;
  loading?: boolean;
  modelId: TtsSpeechModelId;
  characterCount: number;
  onModelChange: (modelId: TtsSpeechModelId) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  creditsLine: string;
  previewing?: boolean;
  previewLoading?: boolean;
  generating?: boolean;
  canGenerate?: boolean;
  onChangeVoice: () => void;
  onPreview?: () => void;
  onGenerate: () => void;
}) {
  const flag = voice?.labels?.languageFlag ?? "🌐";
  const language = voice?.labels?.languageLabel ?? "Multilingual";
  const style = voice?.labels?.style ?? "General";

  return (
    <div className="space-y-3">
      <PanelRow emoji="🎤" label="Selected Voice">
        {loading && !voice ? (
          <span className="inline-flex items-center gap-2 text-zorixa-muted">
            <Loader2 className="size-3.5 animate-spin" />
            Loading voices…
          </span>
        ) : voice ? (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span aria-hidden className="text-base leading-none">
              {flag}
            </span>
            <span className="truncate font-display font-semibold">{voice.name}</span>
          </span>
        ) : (
          <span className="text-white/70">No voice selected</span>
        )}
      </PanelRow>

      <PanelRow emoji="⚡" label="Speech Model">
        <SpeechModelPicker
          modelId={modelId}
          characterCount={characterCount}
          onModelChange={onModelChange}
        />
      </PanelRow>

      <PanelRow emoji="🌍" label="Language">
        {voice ? (
          <span className="text-white/90">
            {language}
            <span className="mx-1.5 text-white/25" aria-hidden>
              ·
            </span>
            <span className="text-zorixa-muted">{style}</span>
          </span>
        ) : (
          <span className="text-zorixa-muted">—</span>
        )}
      </PanelRow>

      <PanelRow emoji="🎚️" label="Speed">
        <SpeechSpeedSlider speed={speed} onSpeedChange={onSpeedChange} />
      </PanelRow>

      <PanelRow emoji="📊" label="Credits">
        <span className="tabular-nums text-[#00e5ff]/90">{creditsLine}</span>
      </PanelRow>

      <div className="flex gap-2 pt-0.5 2xl:flex-col">
        {onPreview ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onPreview}
            disabled={previewLoading && !previewing}
            className={cn(
              "h-8 flex-1 rounded-lg px-2.5 text-xs font-semibold 2xl:w-full 2xl:flex-none",
              previewing
                ? "bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/15"
                : "bg-white/[0.04] text-white hover:bg-white/[0.07]",
              previewLoading && !previewing && "opacity-60"
            )}
          >
            {previewLoading && !previewing ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : previewing ? (
              <Pause className="mr-1 size-3" />
            ) : (
              <Play className="mr-1 size-3" />
            )}
            {previewing ? "Stop preview" : "Preview"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          onClick={onChangeVoice}
          className="h-8 flex-1 rounded-lg bg-white/[0.04] px-2.5 text-xs font-semibold text-white hover:bg-white/[0.07] 2xl:w-full 2xl:flex-none"
        >
          <Mic className="mr-1 size-3" />
          Change voice
        </Button>
      </div>

      <Button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate || generating}
        className="h-11 w-full rounded-xl bg-gradient-to-r from-[#8338eb] to-[#00e5ff] text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40 2xl:h-12 2xl:text-base"
      >
        <Rocket className="mr-1.5 size-3.5" />
        {generating ? "Generating…" : "Generate speech"}
      </Button>
    </div>
  );
}

export function SelectedVoiceSummary({
  voice,
  loading,
  modelId,
  characterCount,
  onModelChange,
  speed,
  onSpeedChange,
  creditsLine,
  previewing,
  previewLoading,
  generating,
  canGenerate,
  onChangeVoice,
  onPreview,
  onGenerate
}: {
  voice: TtsVoice | undefined;
  loading?: boolean;
  modelId: TtsSpeechModelId;
  characterCount: number;
  onModelChange: (modelId: TtsSpeechModelId) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  creditsLine: string;
  previewing?: boolean;
  previewLoading?: boolean;
  generating?: boolean;
  canGenerate?: boolean;
  onChangeVoice: () => void;
  onPreview?: () => void;
  onGenerate: () => void;
}) {
  return (
    <ControlPanelBody
      voice={voice}
      loading={loading}
      modelId={modelId}
      characterCount={characterCount}
      onModelChange={onModelChange}
      speed={speed}
      onSpeedChange={onSpeedChange}
      creditsLine={creditsLine}
      previewing={previewing}
      previewLoading={previewLoading}
      generating={generating}
      canGenerate={canGenerate}
      onChangeVoice={onChangeVoice}
      onPreview={onPreview}
      onGenerate={onGenerate}
    />
  );
}
