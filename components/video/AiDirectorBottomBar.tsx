"use client";

import { motion } from "framer-motion";
import { Sparkles, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ActionTabsRow, type ActionTab } from "@/components/video/ActionTabsRow";
import { DirectorAspectPicker } from "@/components/video/DirectorAspectPicker";
import { DirectorDurationPicker } from "@/components/video/DirectorDurationPicker";
import { DirectorExamples } from "@/components/video/DirectorExamples";
import { DirectorQualityPresetPicker } from "@/components/video/DirectorQualityPresetPicker";
import { DirectorReasoningCard } from "@/components/video/DirectorReasoningCard";
import { DirectorStylePicker } from "@/components/video/DirectorStylePicker";
import { DirectorWhyDialog } from "@/components/video/DirectorWhyDialog";
import type { VideoGenerateContext } from "@/components/video/VideoBottomBar";
import { directorSpeedTierForQualityPreset } from "@/lib/ai-director/router";
import type { DirectorAspectRatio } from "@/lib/ai-director/aspect-options";
import type { DirectorExample, DirectorQualityPreset, DirectorStyleInput } from "@/lib/ai-director/types";
import { videoComposerSupportsGenerateAudio } from "@/lib/atlas-video-generate-audio";
import { videoComposerSupportsSpeedTier } from "@/lib/atlas-video-model-ids";
import { formatGenerationCreditsLine } from "@/lib/atlas-pricing-catalog";
import { studioReferenceImageAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

export type AiDirectorBottomBarProps = {
  prompt: string;
  onPromptChange: (v: string) => void;
  actionTab: ActionTab;
  onActionTabChange: (tab: ActionTab) => void;
  promptImageUrl: string | null;
  onPromptImageChange: (url: string | null) => void;
  directorStyle: DirectorStyleInput;
  onDirectorStyleChange: (style: DirectorStyleInput) => void;
  qualityPreset: DirectorQualityPreset;
  onQualityPresetChange: (preset: DirectorQualityPreset) => void;
  modelLabel: string | null;
  modelSummary: string | null;
  whyBullets: string[];
  estimatedCredits: number;
  routedModelId: string | null;
  directorResolution: string;
  durationSec: number;
  durationOptions: number[];
  onDurationChange: (seconds: number) => void;
  aspectRatio: DirectorAspectRatio;
  aspectOptions: readonly DirectorAspectRatio[];
  onAspectChange: (aspect: DirectorAspectRatio) => void;
  soundtrackOn: boolean;
  onSoundtrackChange: (on: boolean) => void;
  directorExamples: DirectorExample[];
  activeExampleId?: string | null;
  onExampleSelect: (example: DirectorExample) => void;
  loadingGenerate: boolean;
  onGenerate: (ctx: VideoGenerateContext) => void | Promise<void>;
  onHeightChange?: (height: number) => void;
};

export function AiDirectorBottomBar({
  prompt,
  onPromptChange,
  actionTab,
  onActionTabChange,
  promptImageUrl,
  onPromptImageChange,
  directorStyle,
  onDirectorStyleChange,
  qualityPreset,
  onQualityPresetChange,
  modelLabel,
  modelSummary,
  whyBullets,
  estimatedCredits,
  routedModelId,
  directorResolution,
  durationSec,
  durationOptions,
  onDurationChange,
  aspectRatio,
  aspectOptions,
  onAspectChange,
  soundtrackOn,
  onSoundtrackChange,
  directorExamples,
  activeExampleId,
  onExampleSelect,
  loadingGenerate,
  onGenerate,
  onHeightChange
}: AiDirectorBottomBarProps) {
  const bottomBarRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const promptMirrorRef = useRef(prompt);
  promptMirrorRef.current = prompt;
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => {
    const el = bottomBarRef.current;
    if (!el || !onHeightChange) return;
    const ro = new ResizeObserver(() => onHeightChange(el.offsetHeight));
    ro.observe(el);
    onHeightChange(el.offsetHeight);
    return () => ro.disconnect();
  }, [onHeightChange]);

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      onPromptImageChange(URL.createObjectURL(file));
    },
    [onPromptImageChange]
  );

  const emitGenerate = useCallback(() => {
    const fromDom = promptTextareaRef.current?.value;
    const promptText = fromDom ?? promptMirrorRef.current;
    void onGenerate({
      promptText,
      actionTab: "AI Director",
      aspectRatio,
      resolution: directorResolution,
      durationSeconds: durationSec,
      promptImageUrl,
      promptImage2Url: null,
      lipsyncAudioUrl: null,
      editSourceVideoUrl: null,
      motionVideoUrl: null,
      characterOrientation: "image",
      keepOriginalSound: true,
      referenceImageUrls: [],
      referenceVideoUrls: [],
      referenceAudioUrls: [],
      generateAudio: soundtrackOn,
      speedTier:
        routedModelId && videoComposerSupportsSpeedTier(routedModelId)
          ? directorSpeedTierForQualityPreset(qualityPreset)
          : "standard",
      wan26ShotType: "single",
      klingV3ShotMode: "single"
    });
  }, [
    onGenerate,
    promptImageUrl,
    soundtrackOn,
    directorResolution,
    durationSec,
    aspectRatio,
    routedModelId,
    qualityPreset
  ]);

  const creditsDisplay = formatGenerationCreditsLine(estimatedCredits);
  const showSoundtrackToggle = routedModelId
    ? videoComposerSupportsGenerateAudio(routedModelId)
    : false;
  const grokNativeAudio =
    routedModelId === "grok-imagine-video-t2v" ||
    routedModelId === "grok-imagine-video-i2v-15";

  const showExamples = !prompt.trim() && directorExamples.length > 0;

  return (
    <>
      <DirectorWhyDialog
        open={whyOpen}
        modelLabel={modelLabel ?? "this model"}
        bullets={whyBullets}
        onClose={() => setWhyOpen(false)}
      />

      <footer
        ref={bottomBarRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-[rgba(131,56,235,0.15)] bg-[#0d0d14]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[12px]",
          "px-5 py-3 font-body"
        )}
      >
        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-3">
          <ActionTabsRow active={actionTab} onChange={onActionTabChange} className="h-11 min-h-[44px] w-full" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileInput}
            />
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "relative flex h-[88px] w-[150px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl",
                  "border border-dashed border-white/20 bg-black/40 text-zorixa-muted transition-colors",
                  "hover:border-white/30 hover:bg-black/55"
                )}
              >
                {promptImageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={promptImageUrl} alt={studioReferenceImageAlt("video")} className="absolute inset-0 size-full object-cover" />
                ) : (
                  <>
                    <Upload className="size-5 opacity-60" />
                    <span className="mt-2 text-center text-xs font-medium text-zorixa-muted">
                      Start image
                      <span className="block text-[10px] font-normal text-white/40">optional</span>
                    </span>
                  </>
                )}
              </button>
              {promptImageUrl ? (
                <button
                  type="button"
                  onClick={() => onPromptImageChange(null)}
                  className="absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80 hover:bg-black hover:text-white"
                  aria-label="Remove start image"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {showExamples ? (
                <DirectorExamples
                  examples={directorExamples}
                  activeId={activeExampleId}
                  onSelect={onExampleSelect}
                />
              ) : null}
              <textarea
                ref={promptTextareaRef}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                rows={2}
                placeholder="Describe the video — e.g. Create a cinematic car ad at night in Tokyo…"
                className={cn(
                  "w-full resize-y rounded-lg bg-[#0a0a0a] px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-zorixa-muted",
                  "focus-visible:ring-2 focus-visible:ring-brand"
                )}
              />
              <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
                <DirectorStylePicker value={directorStyle} onChange={onDirectorStyleChange} />
                <div className="flex flex-wrap items-center gap-2">
                  <DirectorQualityPresetPicker value={qualityPreset} onChange={onQualityPresetChange} />
                  <DirectorDurationPicker
                    options={durationOptions}
                    value={durationSec}
                    onChange={onDurationChange}
                  />
                  <DirectorAspectPicker
                    options={aspectOptions}
                    value={aspectRatio}
                    onChange={onAspectChange}
                  />
                </div>
                {showSoundtrackToggle ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/50">Soundtrack</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={soundtrackOn}
                      aria-label={soundtrackOn ? "Soundtrack on" : "Soundtrack off"}
                      onClick={() => onSoundtrackChange(!soundtrackOn)}
                      className={cn(
                        "flex min-w-[72px] items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        soundtrackOn
                          ? "bg-[#16a34a] text-white shadow-[0_0_12px_rgba(22,163,74,0.35)]"
                          : "bg-zinc-700 text-zinc-300"
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          soundtrackOn ? "bg-white" : "bg-zinc-500"
                        )}
                      />
                      {soundtrackOn ? "On" : "Off"}
                    </button>
                  </div>
                ) : grokNativeAudio ? (
                  <span className="text-xs text-[#86efac]/90">Native audio included</span>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                {modelLabel && modelSummary ? (
                  <DirectorReasoningCard
                    className="min-w-0 flex-1"
                    modelLabel={modelLabel}
                    summary={modelSummary}
                    onWhyClick={() => setWhyOpen(true)}
                  />
                ) : (
                  <div className="min-w-0 flex-1" />
                )}
                <div className="flex shrink-0 items-center justify-end gap-2.5 pb-0.5 sm:ml-auto">
                  <span className="text-sm font-semibold tabular-nums text-white/90">{creditsDisplay}</span>
                  <motion.button
                    type="button"
                    disabled={loadingGenerate || !prompt.trim()}
                    whileHover={loadingGenerate || !prompt.trim() ? undefined : { scale: 1.02 }}
                    whileTap={loadingGenerate || !prompt.trim() ? undefined : { scale: 0.98 }}
                    onClick={emitGenerate}
                    className="inline-flex min-w-[140px] shrink-0 items-center justify-center gap-2 rounded-xl bg-zorixa-tab px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:bg-[#1d4ed8] disabled:opacity-60"
                  >
                    {loadingGenerate ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    GENERATE
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
