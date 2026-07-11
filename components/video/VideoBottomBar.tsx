"use client";

import { Check, ChevronUp, CircleHelp, Expand, Film, Sparkles, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Badge } from "@/components/ui/Badge";
import { ModelBrandLogo } from "@/components/ui/ModelBrandLogo";
import { VideoLightbox } from "@/components/ui/VideoLightbox";
import {
  VIDEO_SEEDANCE_R2V_DOCK_HEIGHT,
  VIDEO_WAN_R2V_DOCK_HEIGHT
} from "@/lib/composer-dock-height";
import { studioReferenceImageAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

import type { KlingMotionCharacterOrientation } from "@/lib/atlas-kling-motion-control";
import {
  ASPECT_STEP_OPTIONS,
  bottomBarModelsForActionTab,
  HAPPYHORSE_DURATION_OPTIONS,
  HAILUO_23_DURATION_OPTIONS,
  HAILUO_23_T2V_DURATION_SECONDS,
  happyHorseVideoEditMaxImages,
  happyHorseVideoEditSupportsReferenceImages,
  referenceToVideoMaxImages,
  seedanceComposerSupportsReferenceMedia,
  wan27ComposerSupportsReferenceMedia,
  wan27ReferenceDurationOptionsForTab,
  wan27VideoEditMaxImages,
  wan27VideoEditSupportsReferenceImages,
  WAN27_DURATION_OPTIONS,
  videoComposerUsesAudioToVideoBarLayout,
  videoComposerUses720p1080pOnly,
  referenceToVideoHide480p,
  videoComposerUsesHappyHorse,
  videoComposerUsesHailuo,
  veo31AspectOptionsForUi,
  veo31DurationOptionsForTab,
  videoComposerUsesVeo31,
  veo31ReferenceDurationSeconds,
  videoComposerUsesWan27,
  wan26DurationOptionsForTab,
  isWan26ComposerId,
  GEMINI_OMNI_FLASH_DURATION_OPTIONS,
  GEMINI_OMNI_FLASH_I2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_MAX_IMAGES,
  GEMINI_OMNI_FLASH_REFERENCE_DURATION_OPTIONS,
  GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS,
  GEMINI_OMNI_FLASH_RESOLUTION_OPTIONS,
  GEMINI_OMNI_FLASH_R2V_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_ASPECT_OPTIONS,
  GROK_IMAGINE_VIDEO_DURATION_OPTIONS,
  GROK_IMAGINE_VIDEO_REFERENCE_DURATION_OPTIONS,
  GROK_IMAGINE_VIDEO_RESOLUTION_OPTIONS,
  GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
  isGrokImagineVideoComposerId,
  isKling30ProComposerId,
  isGeminiOmniFlashComposerId,
  kling30ProComposerSupportsShotType,
  klingV3AspectOptionsForUi,
  klingV3DurationOptionsForUi,
  type KlingV3ShotMode,
  wan26ComposerSupportsShotType,
  type Wan26ShotType,
  MODE_DROPUP_OPTIONS,
  videoComposerSupportsEndFrame,
  videoComposerUsesTextOnlyLayout,
  atlasSpeedTierUiLabel,
  characterSwapTabUsesDualAssetPipeline,
  videoComposerUsesCharacterSwapBarLayout,
  videoToVideoTabUsesDualAssetPipeline,
  videoToVideoTabUsesKlingMotion,
  videoToVideoTabUsesWanCharacterSwap,
  videoToVideoTabUsesViduStartEnd,
  RESOLUTION_STEP_OPTIONS,
  seedance20ResolutionOptionsForTab,
  isSeedance20ComposerId,
  STANDARD_DURATION_OPTIONS,
  TIME_SECONDS_OPTIONS,
  type BottomBarModel
} from "@/components/video/bottom-bar-models";
import { videoComposerSupportsGenerateAudio } from "@/lib/atlas-video-generate-audio";
import {
  parseVideoSpeedTierFromUiLabel,
  videoComposerSupportsSpeedTier
} from "@/lib/atlas-video-model-ids";
import { AUDIO_TO_VIDEO_RESOLUTION_OPTIONS } from "@/lib/atlas-audio-to-video";
import { isViduQ3ComposerId, isViduQ3ProComposerId } from "@/lib/atlas-vidu-video";

import { ActionTabsRow, type ActionTab } from "@/components/video/ActionTabsRow";
import { AudioUploadSlotContent, audioUploadSlotClass } from "@/components/video/AudioUploadSlotContent";
import { ReferenceAtlasColumnUpload } from "@/components/video/ReferenceAtlasColumnUpload";
import { ReferenceImageUploadStrip } from "@/components/video/ReferenceImageUploadStrip";
import { SeedanceReferenceUploadPanel } from "@/components/video/SeedanceReferenceUploadPanel";
import { WanReferenceUploadPanel } from "@/components/video/WanReferenceUploadPanel";
import { SeedanceI2vReferenceTip } from "@/components/video/SeedanceI2vReferenceTip";
import {
  VIDEO_I2V_FRAME_GRID,
  VIDEO_UPLOAD_PAIR_GRID,
  videoImageUploadSlotClass
} from "@/components/video/video-upload-slot-classes";
import { useIsLgUp } from "@/lib/hooks/use-studio-nav-offset";

export type VideoGenerateContext = {
  promptText: string;
  actionTab: ActionTab;
  /** Bottom-bar aspect selector (e.g. 16:9, 9:16) — sent to API as `aspectRatio`. */
  aspectRatio: string;
  /** Bottom-bar resolution (480p, 720p, 1080p) — sent to API as `resolution`. */
  resolution: string;
  /** Clip length in seconds — sent to API as `duration`. */
  durationSeconds: number;
  promptImageUrl: string | null;
  promptImage2Url: string | null;
  lipsyncAudioUrl: string | null;
  editSourceVideoUrl: string | null;
  /** Motion Control — dance/action reference clip. */
  motionVideoUrl: string | null;
  characterOrientation: KlingMotionCharacterOrientation;
  keepOriginalSound: boolean;
  /** Reference-to-video slots (up to 9 for Seedance 2.0 / HappyHorse; 4 for others). */
  referenceImageUrls: (string | null)[];
  /** Seedance 2.0 R2V — up to 3 reference videos. */
  referenceVideoUrls: (string | null)[];
  /** Seedance 2.0 R2V — up to 3 reference audios. */
  referenceAudioUrls: (string | null)[];
  /** Native AI soundtrack (Seedance, Kling v3). */
  generateAudio: boolean;
  /** Standard vs Fast Atlas model tier (Seedance + Kling). */
  speedTier: "standard" | "fast";
  /** Wan 2.6 — Atlas `shot_type` (single | multi). */
  wan26ShotType: Wan26ShotType;
  /** Kling 3.0 Pro — single shot vs multi-shot (intelligent). */
  klingV3ShotMode: KlingV3ShotMode;
};

export type VideoBottomBarProps = {
  prompt: string;
  onPromptChange: (v: string) => void;
  /** Active preview tab — drives which assets are shown and sent to the API. */
  actionTab: ActionTab;
  onActionTabChange: (tab: ActionTab) => void;
  promptImageUrl: string | null;
  onPromptImageChange: (url: string | null, file?: File | null) => void;
  promptImage2Url?: string | null;
  onPromptImage2Change?: (url: string | null, file?: File | null) => void;
  lipsyncAudioUrl: string | null;
  onLipsyncAudioUrlChange: (url: string | null, file?: File | null) => void;
  editSourceVideoUrl: string | null;
  onEditSourceVideoUrlChange: (url: string | null, file?: File | null) => void;
  motionVideoUrl?: string | null;
  onMotionVideoUrlChange?: (url: string | null, file?: File | null) => void;
  characterOrientation?: KlingMotionCharacterOrientation;
  onCharacterOrientationChange?: (v: KlingMotionCharacterOrientation) => void;
  keepOriginalSound?: boolean;
  onKeepOriginalSoundChange?: (v: boolean) => void;
  referenceImageUrls?: (string | null)[];
  onReferenceImageChange?: (index: number, url: string | null, file?: File | null) => void;
  /** Seedance 2.0 R2V — up to 3 reference videos. */
  referenceVideoUrls?: (string | null)[];
  onReferenceVideoChange?: (index: number, url: string | null, file?: File | null) => void;
  /** Seedance 2.0 R2V — up to 3 reference audios. */
  referenceAudioUrls?: (string | null)[];
  onReferenceAudioChange?: (index: number, url: string | null, file?: File | null) => void;
  /** Bottom bar model (dropup). */
  composerModelId: string;
  onComposerModelChange: (id: string) => void;
  generateAudioOn: boolean;
  onGenerateAudioChange: (v: boolean) => void;
  modeValue: string;
  onModeChange: (v: string) => void;
  durationStandard: string;
  onDurationStandardChange: (v: string) => void;
  timeSeconds: number;
  onTimeSecondsChange: (v: number) => void;
  aspect: string;
  onAspectChange: (v: string) => void;
  resolution: string;
  onResolutionChange: (v: string) => void;
  /** Wan 2.6 — Shot Type (Atlas `shot_type`). */
  wan26ShotType?: Wan26ShotType;
  onWan26ShotTypeChange?: (v: Wan26ShotType) => void;
  /** Kling 3.0 Pro — single vs multi-shot. */
  klingV3ShotMode?: KlingV3ShotMode;
  onKlingV3ShotModeChange?: (v: KlingV3ShotMode) => void;
  creditsLine: string;
  loadingGenerate: boolean;
  /** Snapshot of prompt + assets at click time (reads textarea ref so text is never stale). */
  onGenerate: (ctx: VideoGenerateContext) => void | Promise<void>;
  /** Report measured height so the page can reserve space above this fixed bar. */
  onHeightChange?: (height: number) => void;
};

type OpenPanel = "model" | "mode" | "standard" | "time" | "aspect" | "resolution" | null;

const dropupPanelClass =
  "absolute bottom-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-[rgba(131,56,235,0.2)] bg-zorixa-dropdown shadow-glow-lg ring-1 ring-white/5";

const modelMenuPanelClass =
  "fixed z-[250] overflow-y-auto studio-scrollbar rounded-xl border border-[rgba(131,56,235,0.2)] bg-zorixa-dropdown py-1 shadow-glow-lg ring-1 ring-white/5";

const triggerClass =
  "inline-flex h-9 min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] px-3 text-xs font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand max-lg:h-8 max-lg:min-h-[32px] max-lg:gap-1 max-lg:px-2 max-lg:text-[11px]";

const videoControlLabelClass =
  "text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted max-lg:sr-only";

function GenerateAudioToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "Generate audio on" : "Generate audio off"}
      onClick={() => onChange(!on)}
      className={cn(
        "flex min-w-[72px] items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
        on
          ? "bg-[#16a34a] text-white shadow-[0_0_12px_rgba(22,163,74,0.35)]"
          : "bg-zinc-700 text-zinc-300"
      )}
    >
      <span className={cn("size-2 rounded-full transition-colors", on ? "bg-white" : "bg-zinc-500")} />
      {on ? "On" : "Off"}
    </button>
  );
}

export function VideoBottomBar({
  prompt,
  onPromptChange,
  actionTab,
  onActionTabChange,
  promptImageUrl,
  onPromptImageChange,
  promptImage2Url = null,
  onPromptImage2Change,
  lipsyncAudioUrl,
  onLipsyncAudioUrlChange,
  editSourceVideoUrl,
  onEditSourceVideoUrlChange,
  motionVideoUrl = null,
  onMotionVideoUrlChange,
  characterOrientation = "image",
  onCharacterOrientationChange,
  keepOriginalSound = true,
  onKeepOriginalSoundChange,
  referenceImageUrls = [null, null, null, null],
  onReferenceImageChange,
  referenceVideoUrls = [null, null, null],
  onReferenceVideoChange,
  referenceAudioUrls = [null, null, null],
  onReferenceAudioChange,
  composerModelId,
  onComposerModelChange,
  generateAudioOn,
  onGenerateAudioChange,
  modeValue,
  onModeChange,
  durationStandard,
  onDurationStandardChange,
  timeSeconds,
  onTimeSecondsChange,
  aspect,
  onAspectChange,
  resolution,
  onResolutionChange,
  wan26ShotType = "single",
  onWan26ShotTypeChange,
  klingV3ShotMode = "single",
  onKlingV3ShotModeChange,
  creditsLine,
  loadingGenerate,
  onGenerate,
  onHeightChange
}: VideoBottomBarProps) {
  const isLgUp = useIsLgUp();
  const [open, setOpen] = useState<OpenPanel>(null);
  const bottomBarRef = useRef<HTMLElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const [modelMenuStyle, setModelMenuStyle] = useState<React.CSSProperties | null>(null);
  const [modelMenuMounted, setModelMenuMounted] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  /** Mirrors latest `prompt` prop every render — survives stale closures if Generate fires before React commits the last keystroke. */
  const promptMirrorRef = useRef(prompt);
  promptMirrorRef.current = prompt;
  const fileRef = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const fileAudioRef = useRef<HTMLInputElement>(null);
  const fileVideoRef = useRef<HTMLInputElement>(null);
  const fileMotionVideoRef = useRef<HTMLInputElement>(null);
  const [file1Name, setFile1Name] = useState<string | null>(null);
  const [file2Name, setFile2Name] = useState<string | null>(null);
  const [uploadVideoLightbox, setUploadVideoLightbox] = useState<{
    src: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setModelMenuMounted(true);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (modelMenuRef.current?.contains(target)) return;
      if (!bottomBarRef.current?.contains(target)) setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const openOnly = useCallback((panel: OpenPanel) => {
    setOpen((prev) => (prev === panel ? null : panel));
  }, []);

  const applySlot1File = useCallback(
    (file: File) => {
      if (
        (actionTab === "Video to Video" &&
          (videoToVideoTabUsesDualAssetPipeline(composerModelId) ||
            videoToVideoTabUsesViduStartEnd(composerModelId)))
      ) {
        if (!file.type.startsWith("image/")) return;
      } else if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        return;
      }
      const url = URL.createObjectURL(file);
      onPromptImageChange(url, file);
      setFile1Name(file.name);
    },
    [actionTab, composerModelId, onPromptImageChange]
  );

  const applySlot2File = useCallback(
    (file: File) => {
      if (!onPromptImage2Change) return;
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
      const url = URL.createObjectURL(file);
      onPromptImage2Change(url, file);
      setFile2Name(file.name);
    },
    [onPromptImage2Change]
  );

  const onFile1Input = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) applySlot1File(f);
      e.target.value = "";
    },
    [applySlot1File]
  );

  const onFile2Input = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) applySlot2File(f);
      e.target.value = "";
    },
    [applySlot2File]
  );

  const stopDragDefaults = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDropSlot1 = useCallback(
    (e: React.DragEvent) => {
      stopDragDefaults(e);
      const f = e.dataTransfer.files?.[0];
      if (f) applySlot1File(f);
    },
    [applySlot1File, stopDragDefaults]
  );

  const onDropSlot2 = useCallback(
    (e: React.DragEvent) => {
      stopDragDefaults(e);
      const f = e.dataTransfer.files?.[0];
      if (f) applySlot2File(f);
    },
    [applySlot2File, stopDragDefaults]
  );

  const applyAudioFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("audio/")) return;
      const url = URL.createObjectURL(file);
      onLipsyncAudioUrlChange(url, file);
    },
    [onLipsyncAudioUrlChange]
  );

  const applyVideoFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("video/")) return;
      const url = URL.createObjectURL(file);
      onEditSourceVideoUrlChange(url, file);
    },
    [onEditSourceVideoUrlChange]
  );

  const applyMotionVideoFile = useCallback(
    (file: File) => {
      if (!onMotionVideoUrlChange) return;
      if (!file.type.startsWith("video/")) return;
      const url = URL.createObjectURL(file);
      onMotionVideoUrlChange(url, file);
    },
    [onMotionVideoUrlChange]
  );

  const onAudioInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) applyAudioFile(f);
      e.target.value = "";
    },
    [applyAudioFile]
  );

  const onVideoInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) applyVideoFile(f);
      e.target.value = "";
    },
    [applyVideoFile]
  );

  const onDropAudio = useCallback(
    (e: React.DragEvent) => {
      stopDragDefaults(e);
      const f = e.dataTransfer.files?.[0];
      if (f) applyAudioFile(f);
    },
    [applyAudioFile, stopDragDefaults]
  );

  const onDropVideo = useCallback(
    (e: React.DragEvent) => {
      stopDragDefaults(e);
      const f = e.dataTransfer.files?.[0];
      if (f) applyVideoFile(f);
    },
    [applyVideoFile, stopDragDefaults]
  );

  const onMotionVideoInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) applyMotionVideoFile(f);
      e.target.value = "";
    },
    [applyMotionVideoFile]
  );

  const onDropMotionVideo = useCallback(
    (e: React.DragEvent) => {
      stopDragDefaults(e);
      const f = e.dataTransfer.files?.[0];
      if (f) applyMotionVideoFile(f);
    },
    [applyMotionVideoFile, stopDragDefaults]
  );

  useEffect(() => {
    if (!promptImageUrl) setFile1Name(null);
  }, [promptImageUrl]);

  useEffect(() => {
    if (!promptImage2Url) setFile2Name(null);
  }, [promptImage2Url]);

  const showReferenceLayout = actionTab === "Reference to Video";
  const referenceMaxImages = referenceToVideoMaxImages(composerModelId);
  const showSeedanceReferenceMedia =
    showReferenceLayout && seedanceComposerSupportsReferenceMedia(composerModelId);
  const showWanReferenceMedia =
    showReferenceLayout && wan27ComposerSupportsReferenceMedia(composerModelId);
  const showGeminiReferenceMedia =
    showReferenceLayout && composerModelId === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID;
  const showReferenceMediaPanel =
    showSeedanceReferenceMedia || showWanReferenceMedia || showGeminiReferenceMedia;
  const useStableDockHeight = showReferenceMediaPanel && isLgUp;
  const stableDockHeight = showWanReferenceMedia
    ? VIDEO_WAN_R2V_DOCK_HEIGHT
    : VIDEO_SEEDANCE_R2V_DOCK_HEIGHT;

  useEffect(() => {
    if (!onHeightChange) return;
    if (useStableDockHeight) {
      onHeightChange(stableDockHeight);
      return;
    }
    const el = bottomBarRef.current;
    if (!el) return;

    function measure() {
      const node = bottomBarRef.current;
      if (node) onHeightChange?.(node.offsetHeight);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeightChange, stableDockHeight, useStableDockHeight]);

  const showViduStartEndLayout =
    actionTab === "Video to Video" && videoToVideoTabUsesViduStartEnd(composerModelId);
  const showMotionControlLayout =
    actionTab === "Video to Video" && videoToVideoTabUsesKlingMotion(composerModelId);
  const showWanCharacterSwapLayout =
    actionTab === "Video to Video" && videoToVideoTabUsesWanCharacterSwap(composerModelId);
  const showDualAssetV2vLayout = showMotionControlLayout || showWanCharacterSwapLayout;
  const showWanV2vLayout =
    actionTab === "Video to Video" && !showViduStartEndLayout && !showDualAssetV2vLayout;
  const showHappyHorseV2vRefs = happyHorseVideoEditSupportsReferenceImages(
    composerModelId,
    actionTab
  );
  const showWanV2vRefs = wan27VideoEditSupportsReferenceImages(composerModelId, actionTab);
  const happyHorseV2vRefMax = happyHorseVideoEditMaxImages();
  const wanV2vRefMax = wan27VideoEditMaxImages();
  const showHappyHorseLayout = videoComposerUsesHappyHorse(composerModelId);
  const showHailuoLayout = videoComposerUsesHailuo(composerModelId);
  const hideHailuoT2vTimeControl = showHailuoLayout && actionTab === "Text to Video";
  const showWan27Layout = videoComposerUsesWan27(composerModelId);
  const showWan26Layout = isWan26ComposerId(composerModelId);
  const showKling30Layout = isKling30ProComposerId(composerModelId);
  const showGeminiLayout = isGeminiOmniFlashComposerId(composerModelId);
  const showGeminiImageLayout =
    actionTab === "Image to Video" && composerModelId === GEMINI_OMNI_FLASH_I2V_COMPOSER_ID;
  const showGrokLayout = isGrokImagineVideoComposerId(composerModelId);
  const showGrokReferenceMedia =
    showReferenceLayout && composerModelId === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID;
  const showVeo31Layout = videoComposerUsesVeo31(composerModelId);
  const geminiT2vOrI2v =
    showGeminiLayout && (actionTab === "Text to Video" || actionTab === "Image to Video");
  const grokT2vOrI2v =
    showGrokLayout && (actionTab === "Text to Video" || actionTab === "Image to Video");
  const veo31T2vOrI2v =
    showVeo31Layout && (actionTab === "Text to Video" || actionTab === "Image to Video");
  const kling30T2vOrI2v =
    showKling30Layout &&
    (actionTab === "Text to Video" || actionTab === "Image to Video");
  const hideKlingResolution =
    showKling30Layout &&
    (actionTab === "Text to Video" || actionTab === "Image to Video");
  const aspectOptionsForTab = grokT2vOrI2v || showGrokReferenceMedia
    ? [...GROK_IMAGINE_VIDEO_ASPECT_OPTIONS]
    : geminiT2vOrI2v || showGeminiReferenceMedia
    ? ["16:9", "9:16"]
    : veo31T2vOrI2v
    ? [...veo31AspectOptionsForUi()]
    : kling30T2vOrI2v
      ? [...klingV3AspectOptionsForUi()]
      : [...ASPECT_STEP_OPTIONS];
  const show720p1080pOnlyLayout =
    videoComposerUses720p1080pOnly(composerModelId) ||
    (showReferenceLayout && referenceToVideoHide480p(composerModelId));
  const showAudioToVideoLayout = videoComposerUsesAudioToVideoBarLayout(composerModelId, actionTab);
  /** Kling motion / Wan character swap — hides mode, aspect, resolution. */
  const hideWanOnlyBarControls = showDualAssetV2vLayout;
  /** Audio to Video — hide mode/aspect/time; keep model + resolution (480p/720p). */
  const hideModeAspectControls = showDualAssetV2vLayout || showAudioToVideoLayout;
  const showResolutionControl =
    (showAudioToVideoLayout || !showDualAssetV2vLayout) &&
    !hideKlingResolution &&
    !showHailuoLayout;
  const resolutionOptions = showGrokLayout
    ? [...GROK_IMAGINE_VIDEO_RESOLUTION_OPTIONS]
    : showGeminiLayout
    ? [...GEMINI_OMNI_FLASH_RESOLUTION_OPTIONS]
    : showAudioToVideoLayout
    ? [...AUDIO_TO_VIDEO_RESOLUTION_OPTIONS]
    : isSeedance20ComposerId(composerModelId)
    ? seedance20ResolutionOptionsForTab(actionTab)
    : show720p1080pOnlyLayout
      ? RESOLUTION_STEP_OPTIONS.filter((r) => r.id !== "480p")
      : RESOLUTION_STEP_OPTIONS;
  const characterSwapBar = videoComposerUsesCharacterSwapBarLayout(composerModelId, actionTab);
  const showTextOnlyPromptLayout = videoComposerUsesTextOnlyLayout(composerModelId, actionTab);
  const pickerModels = bottomBarModelsForActionTab(actionTab);
  const selectedModel =
    pickerModels.find((m) => m.id === composerModelId) ?? pickerModels[0] ?? pickerModels[0];

  const updateModelMenuPosition = useCallback(() => {
    const trigger = modelTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 12;
    setModelMenuStyle({
      left: rect.left,
      bottom: window.innerHeight - rect.top + gap,
      minWidth: Math.max(rect.width, 260),
      maxHeight: Math.max(200, rect.top - gap - viewportPadding)
    });
  }, []);

  useLayoutEffect(() => {
    if (open !== "model") {
      setModelMenuStyle(null);
      return;
    }
    updateModelMenuPosition();
    window.addEventListener("resize", updateModelMenuPosition);
    window.addEventListener("scroll", updateModelMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateModelMenuPosition);
      window.removeEventListener("scroll", updateModelMenuPosition, true);
    };
  }, [open, updateModelMenuPosition, pickerModels.length, actionTab]);

  const nativeAudioSupported = videoComposerSupportsGenerateAudio(composerModelId);
  const showGenerateAudioControl =
    nativeAudioSupported &&
    (actionTab === "Text to Video" ||
      actionTab === "Image to Video" ||
      actionTab === "Reference to Video" ||
      (actionTab === "Video to Video" && videoToVideoTabUsesViduStartEnd(composerModelId)));
  const timeOptionsForTab = (() => {
    if (showReferenceLayout) {
      if (showGrokReferenceMedia) return [...GROK_IMAGINE_VIDEO_REFERENCE_DURATION_OPTIONS];
      if (showGeminiReferenceMedia) return [...GEMINI_OMNI_FLASH_REFERENCE_DURATION_OPTIONS];
      if (isViduQ3ComposerId(composerModelId)) return Array.from({ length: 16 }, (_, i) => i + 1);
      if (showVeo31Layout) return veo31DurationOptionsForTab(actionTab);
      if (showWan27Layout) return [...wan27ReferenceDurationOptionsForTab(actionTab)];
      return TIME_SECONDS_OPTIONS.filter((t) => t >= 4 && t <= 15);
    }
    if (showViduStartEndLayout || isViduQ3ProComposerId(composerModelId)) {
      return Array.from({ length: 16 }, (_, i) => i + 1);
    }
    if (showMotionControlLayout || showWanCharacterSwapLayout) return [];
    if (showGrokLayout) return [...GROK_IMAGINE_VIDEO_DURATION_OPTIONS];
    if (showGeminiLayout) return [...GEMINI_OMNI_FLASH_DURATION_OPTIONS];
    if (showHappyHorseLayout) return [...HAPPYHORSE_DURATION_OPTIONS];
    if (showHailuoLayout) return [...HAILUO_23_DURATION_OPTIONS];
    if (showWan26Layout) return [...wan26DurationOptionsForTab(actionTab)];
    if (showWan27Layout) return [...WAN27_DURATION_OPTIONS];
    if (showKling30Layout) return [...klingV3DurationOptionsForUi()];
    if (showVeo31Layout) return veo31DurationOptionsForTab(actionTab);
    return [...TIME_SECONDS_OPTIONS];
  })();
  const generateAudioEffective = generateAudioOn && showGenerateAudioControl;
  const showSpeedTierControl = videoComposerSupportsSpeedTier(composerModelId);
  const showWan26ShotTypeControl = wan26ComposerSupportsShotType(composerModelId, actionTab);
  const showKlingV3ShotTypeControl = kling30ProComposerSupportsShotType(composerModelId, actionTab);
  const speedTier = parseVideoSpeedTierFromUiLabel(durationStandard);
  const showSeedanceI2vTip =
    actionTab === "Image to Video" && composerModelId === "seedance-2";
  const showEndFrameSlot =
    (actionTab === "Image to Video" && videoComposerSupportsEndFrame(composerModelId)) ||
    showViduStartEndLayout;

  const emitGenerate = useCallback(() => {
    const el = promptTextareaRef.current;
    // Prefer live DOM (updates synchronously on every keystroke); fall back to latest prop mirror.
    const fromDom = el?.value;
    const promptText =
      fromDom !== undefined && fromDom !== null ? fromDom : promptMirrorRef.current;

    const ctx: VideoGenerateContext = {
      promptText,
      actionTab,
      aspectRatio: aspect,
      resolution,
      durationSeconds: timeSeconds,
      promptImageUrl,
      promptImage2Url,
      lipsyncAudioUrl,
      editSourceVideoUrl,
      motionVideoUrl,
      characterOrientation,
      keepOriginalSound,
      referenceImageUrls,
      referenceVideoUrls,
      referenceAudioUrls,
      generateAudio: generateAudioEffective,
      speedTier: showSpeedTierControl ? speedTier : "standard",
      wan26ShotType,
      klingV3ShotMode
    };
    console.log("[VideoBottomBar] GENERATE click", {
      promptText,
      promptTextLen: promptText.length,
      fromDomLen: fromDom?.length ?? null,
      mirrorLen: promptMirrorRef.current.length,
      actionTab,
      aspectRatio: aspect,
      resolution,
      durationSeconds: timeSeconds,
      composerModelId,
      hasPromptImage: Boolean(promptImageUrl),
      hasPromptImage2: Boolean(promptImage2Url),
      hasMotionVideo: Boolean(motionVideoUrl),
      hasLipsyncAudio: Boolean(lipsyncAudioUrl),
      hasEditSourceVideo: Boolean(editSourceVideoUrl),
      generateAudio: generateAudioEffective,
      speedTier: showSpeedTierControl ? speedTier : "standard"
    });
    void onGenerate(ctx);
  }, [
    actionTab,
    aspect,
    characterOrientation,
    composerModelId,
    durationStandard,
    editSourceVideoUrl,
    generateAudioEffective,
    keepOriginalSound,
    lipsyncAudioUrl,
    motionVideoUrl,
    onGenerate,
    promptImage2Url,
    promptImageUrl,
    referenceImageUrls,
    referenceVideoUrls,
    referenceAudioUrls,
    resolution,
    showSpeedTierControl,
    speedTier,
    timeSeconds,
    wan26ShotType,
    klingV3ShotMode
  ]);

  return (
    <>
    <footer
      ref={bottomBarRef}
      style={useStableDockHeight ? { minHeight: stableDockHeight } : undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-[rgba(131,56,235,0.15)] bg-[#0d0d14]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[12px]",
        "px-4 py-2 font-body max-lg:px-3",
        showReferenceMediaPanel
          ? "max-lg:max-h-[min(64dvh,540px)]"
          : showSeedanceI2vTip
            ? "max-lg:max-h-[min(60dvh,500px)]"
            : "max-lg:max-h-[min(58dvh,480px)]"
      )}
    >
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-2 max-lg:min-h-0 max-lg:flex-1">
        <div className="shrink-0">
          <ActionTabsRow
            active={actionTab}
            onChange={onActionTabChange}
            className="h-10 min-h-[40px] w-full"
          />
        </div>

        <div className="max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:gap-2 lg:contents">
          <div className="max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-y-contain lg:contents">
        {/* ROW 1 — uploads + prompt */}
        <div
          className={cn(
            "flex min-h-0 gap-2",
            useStableDockHeight && "items-stretch overflow-hidden",
            showReferenceMediaPanel
              ? "max-lg:flex-col max-lg:items-stretch flex-row items-stretch"
              : "flex-col sm:flex-row sm:items-start"
          )}
        >
          {showReferenceLayout ? (
            showSeedanceReferenceMedia ? (
              <SeedanceReferenceUploadPanel
                className="max-w-[min(100%,58%)] shrink-0 max-lg:w-full max-lg:max-w-full"
                composerModelId={composerModelId}
                referenceImageUrls={referenceImageUrls}
                referenceVideoUrls={referenceVideoUrls}
                referenceAudioUrls={referenceAudioUrls}
                onReferenceImageChange={onReferenceImageChange}
                onReferenceVideoChange={onReferenceVideoChange}
                onReferenceAudioChange={onReferenceAudioChange}
              />
            ) : showWanReferenceMedia ? (
              <WanReferenceUploadPanel
                className="max-w-[min(100%,58%)] shrink-0 max-lg:w-full max-lg:max-w-full"
                referenceImageUrls={referenceImageUrls}
                referenceVideoUrls={referenceVideoUrls}
                referenceVoiceUrls={referenceAudioUrls}
                onReferenceImageChange={onReferenceImageChange}
                onReferenceVideoChange={onReferenceVideoChange}
                onReferenceVoiceChange={onReferenceAudioChange}
              />
            ) : showGeminiReferenceMedia ? (
              <div className="grid min-w-0 max-w-[min(100%,58%)] shrink-0 flex-1 grid-cols-2 gap-2 sm:gap-2.5 max-lg:w-full max-lg:max-w-full max-lg:grid-cols-1">
                <ReferenceAtlasColumnUpload
                  kind="image"
                  title="Reference images"
                  hint={`Up to ${GEMINI_OMNI_FLASH_MAX_IMAGES} · character/style`}
                  urls={referenceImageUrls}
                  maxSlots={GEMINI_OMNI_FLASH_MAX_IMAGES}
                  accept="image/*"
                  onChange={onReferenceImageChange}
                />
                <ReferenceAtlasColumnUpload
                  kind="video"
                  title="Source video"
                  hint="Exactly 1 · mp4/mov"
                  urls={referenceVideoUrls}
                  maxSlots={GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS}
                  accept="video/mp4,video/quicktime,video/*"
                  onChange={onReferenceVideoChange}
                />
              </div>
            ) : (
              <ReferenceImageUploadStrip
                referenceImageUrls={referenceImageUrls}
                maxImages={referenceMaxImages}
                onReferenceImageChange={onReferenceImageChange}
              />
            )
          ) : !showTextOnlyPromptLayout ? (
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start max-lg:w-full max-lg:gap-2 max-lg:flex-row max-lg:flex-wrap">
              {showGeminiImageLayout ? (
                <ReferenceImageUploadStrip
                  referenceImageUrls={referenceImageUrls}
                  maxImages={GEMINI_OMNI_FLASH_MAX_IMAGES}
                  onReferenceImageChange={onReferenceImageChange}
                  addSlotLabel="image"
                  countInSlot
                  matchSourceVideoSlot
                />
              ) : showAudioToVideoLayout ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onFile1Input}
                  />
                  <input
                    ref={fileAudioRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onAudioInput}
                  />
                  <div className={VIDEO_UPLOAD_PAIR_GRID}>
                    <div
                      className="relative"
                      onDragEnter={stopDragDefaults}
                      onDragOver={stopDragDefaults}
                      onDrop={onDropSlot1}
                    >
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className={videoImageUploadSlotClass()}
                        aria-label={promptImageUrl ? "Change portrait" : "Upload portrait"}
                      >
                        {promptImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={promptImageUrl} alt={studioReferenceImageAlt("video")} className="absolute inset-0 size-full object-cover" />
                        ) : (
                          <>
                            <Upload className="size-5 opacity-60" />
                            <span className="mt-2 text-xs font-medium text-zorixa-muted">Portrait</span>
                          </>
                        )}
                      </button>
                      {promptImageUrl ? (
                        <button
                          type="button"
                          onClick={() => onPromptImageChange(null)}
                          className={cn(
                            "absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                            "hover:bg-black hover:text-white"
                          )}
                          aria-label="Remove portrait"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <div
                      className="relative"
                      onDragEnter={stopDragDefaults}
                      onDragOver={stopDragDefaults}
                      onDrop={onDropAudio}
                    >
                      <button
                        type="button"
                        onClick={() => fileAudioRef.current?.click()}
                        className={audioUploadSlotClass(Boolean(lipsyncAudioUrl))}
                        aria-label={lipsyncAudioUrl ? "Change audio" : "Upload audio"}
                      >
                        <AudioUploadSlotContent loaded={Boolean(lipsyncAudioUrl)} />
                      </button>
                      {lipsyncAudioUrl ? (
                        <button
                          type="button"
                          onClick={() => onLipsyncAudioUrlChange(null)}
                          className={cn(
                            "absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                            "hover:bg-black hover:text-white"
                          )}
                          aria-label="Remove audio"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : showDualAssetV2vLayout ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onFile1Input}
                  />
                  <input
                    ref={fileMotionVideoRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onMotionVideoInput}
                  />
                  <motion.div className={VIDEO_UPLOAD_PAIR_GRID}>
                    <div
                      className="relative"
                      onDragEnter={stopDragDefaults}
                      onDragOver={stopDragDefaults}
                      onDrop={(e) => {
                        stopDragDefaults(e);
                        const f = e.dataTransfer.files?.[0];
                        if (f) applySlot1File(f);
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className={videoImageUploadSlotClass()}
                        aria-label={
                          promptImageUrl
                            ? showWanCharacterSwapLayout
                              ? "Change character portrait"
                              : "Change character image"
                            : showWanCharacterSwapLayout
                              ? "Upload character portrait"
                              : "Upload character image"
                        }
                      >
                        {promptImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={promptImageUrl} alt={studioReferenceImageAlt("video")} className="absolute inset-0 size-full object-cover" />
                        ) : (
                          <>
                            <Upload className="size-5 opacity-60" />
                            <span className="mt-2 text-center text-xs font-medium text-zorixa-muted">
                              {showWanCharacterSwapLayout ? "Portrait" : "Character"}
                            </span>
                          </>
                        )}
                      </button>
                      {promptImageUrl ? (
                        <button
                          type="button"
                          onClick={() => onPromptImageChange(null)}
                          className={cn(
                            "absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                            "hover:bg-black hover:text-white"
                          )}
                          aria-label="Remove character image"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <motion.div
                      className="relative"
                      onDragEnter={stopDragDefaults}
                      onDragOver={stopDragDefaults}
                      onDrop={onDropMotionVideo}
                    >
                      <button
                        type="button"
                        onClick={() => fileMotionVideoRef.current?.click()}
                        className={videoImageUploadSlotClass()}
                        aria-label={
                          motionVideoUrl
                            ? showWanCharacterSwapLayout
                              ? "Change source video"
                              : "Change motion clip"
                            : showWanCharacterSwapLayout
                              ? "Upload source video"
                              : "Upload motion clip"
                        }
                      >
                        {motionVideoUrl ? (
                          <video
                            src={motionVideoUrl}
                            className="absolute inset-0 size-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <>
                            <Film className="size-5 opacity-60" />
                            <span className="mt-2 text-center text-xs font-medium text-zorixa-muted">
                              {showWanCharacterSwapLayout ? "Source video" : "Motion clip"}
                            </span>
                          </>
                        )}
                      </button>
                      {motionVideoUrl ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!motionVideoUrl) return;
                              setUploadVideoLightbox({
                                src: motionVideoUrl,
                                title: showWanCharacterSwapLayout ? "Source video" : "Original motion"
                              });
                            }}
                            className={cn(
                              "absolute bottom-2 left-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                              "hover:bg-black hover:text-white"
                            )}
                            aria-label={
                              showWanCharacterSwapLayout ? "Preview source video" : "Preview motion clip"
                            }
                          >
                            <Expand className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onMotionVideoUrlChange?.(null)}
                            className={cn(
                              "absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                              "hover:bg-black hover:text-white"
                            )}
                            aria-label="Remove motion clip"
                          >
                            <X className="size-3.5" />
                          </button>
                        </>
                      ) : null}
                    </motion.div>
                  </motion.div>
                </>
              ) : showViduStartEndLayout ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onFile1Input}
                  />
                  <input
                    ref={fileRef2}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onFile2Input}
                  />
                  <div className={VIDEO_I2V_FRAME_GRID}>
                    <div
                      className="relative"
                      onDragEnter={stopDragDefaults}
                      onDragOver={stopDragDefaults}
                      onDrop={onDropSlot1}
                    >
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className={videoImageUploadSlotClass()}
                        aria-label={promptImageUrl ? "Change start frame" : "Upload start frame"}
                      >
                        {promptImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={promptImageUrl} alt={studioReferenceImageAlt("video")} className="absolute inset-0 size-full object-cover" />
                        ) : (
                          <>
                            <Upload className="size-5 opacity-60" />
                            <span className="mt-2 text-xs font-medium text-zorixa-muted">Start frame</span>
                          </>
                        )}
                      </button>
                      {promptImageUrl ? (
                        <button
                          type="button"
                          onClick={() => onPromptImageChange(null)}
                          className={cn(
                            "absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                            "hover:bg-black hover:text-white"
                          )}
                          aria-label="Remove start frame"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <div
                      className="relative"
                      onDragEnter={stopDragDefaults}
                      onDragOver={stopDragDefaults}
                      onDrop={onDropSlot2}
                    >
                      <button
                        type="button"
                        onClick={() => fileRef2.current?.click()}
                        className={videoImageUploadSlotClass()}
                        aria-label={promptImage2Url ? "Change end frame" : "Upload end frame"}
                      >
                        {promptImage2Url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={promptImage2Url} alt={studioReferenceImageAlt("video")} className="absolute inset-0 size-full object-cover" />
                        ) : (
                          <>
                            <Upload className="size-5 opacity-60" />
                            <span className="mt-2 text-xs font-medium text-zorixa-muted">End frame</span>
                          </>
                        )}
                      </button>
                      {promptImage2Url ? (
                        <button
                          type="button"
                          onClick={() => onPromptImage2Change?.(null)}
                          className={cn(
                            "absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                            "hover:bg-black hover:text-white"
                          )}
                          aria-label="Remove end frame"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : showWanV2vLayout ? (
                <div
                  className={cn(
                    "flex w-full shrink-0 gap-3 max-lg:flex-col max-lg:gap-2",
                    showHappyHorseV2vRefs || showWanV2vRefs
                      ? "flex-col sm:flex-row sm:items-start"
                      : "flex-col"
                  )}
                >
                  <input
                    ref={fileVideoRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onVideoInput}
                  />
                  <div
                    className="relative shrink-0"
                    onDragEnter={stopDragDefaults}
                    onDragOver={stopDragDefaults}
                    onDrop={onDropVideo}
                  >
                    <button
                      type="button"
                      onClick={() => fileVideoRef.current?.click()}
                      className={videoImageUploadSlotClass()}
                      aria-label={editSourceVideoUrl ? "Change source video" : "Upload source video"}
                    >
                      {editSourceVideoUrl ? (
                        <video
                          src={editSourceVideoUrl}
                          className="absolute inset-0 size-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <>
                          <Film className="size-5 opacity-60" />
                          <span className="mt-2 text-center text-xs font-medium text-zorixa-muted">
                            Source video
                          </span>
                        </>
                      )}
                    </button>
                    {editSourceVideoUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadVideoLightbox({
                              src: editSourceVideoUrl,
                              title: "Original video"
                            });
                          }}
                          className={cn(
                            "absolute bottom-2 left-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                            "hover:bg-black hover:text-white"
                          )}
                          aria-label="Preview source video"
                        >
                          <Expand className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditSourceVideoUrlChange(null)}
                          className={cn(
                            "absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                            "hover:bg-black hover:text-white"
                          )}
                          aria-label="Remove source video"
                        >
                          <X className="size-3.5" />
                        </button>
                      </>
                    ) : null}
                  </div>
                  {showHappyHorseV2vRefs || showWanV2vRefs ? (
                    <ReferenceImageUploadStrip
                      referenceImageUrls={referenceImageUrls.slice(
                        0,
                        showWanV2vRefs ? wanV2vRefMax : happyHorseV2vRefMax
                      )}
                      maxImages={showWanV2vRefs ? wanV2vRefMax : happyHorseV2vRefMax}
                      onReferenceImageChange={onReferenceImageChange}
                      compact
                      addSlotLabel="image"
                      countInSlot
                      matchSourceVideoSlot
                      className="min-w-0 shrink-0"
                    />
                  ) : null}
                </div>
              ) : (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onFile1Input}
                  />
                  <input
                    ref={fileRef2}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onFile2Input}
                  />

                  <div
                    className={cn(
                      showEndFrameSlot ? VIDEO_I2V_FRAME_GRID : "grid grid-cols-1 gap-3 max-lg:gap-2"
                    )}
                  >
                    <div
                      className="relative"
                      onDragEnter={stopDragDefaults}
                      onDragOver={stopDragDefaults}
                      onDrop={onDropSlot1}
                    >
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className={videoImageUploadSlotClass()}
                        aria-label={promptImageUrl ? "Change Start frame" : "Upload Start frame"}
                      >
                        {promptImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={promptImageUrl} alt={studioReferenceImageAlt("video")} className="absolute inset-0 size-full object-cover" />
                        ) : (
                          <>
                            <Upload className="size-5 opacity-60" />
                            <span className="mt-2 text-xs font-medium text-zorixa-muted">Start frame</span>
                          </>
                        )}
                      </button>
                      {promptImageUrl ? (
                        <button
                          type="button"
                          onClick={() => onPromptImageChange(null)}
                          className={cn(
                            "absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                            "hover:bg-black hover:text-white"
                          )}
                          aria-label="Remove Start frame"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>

                    {showEndFrameSlot ? (
                    <div
                      onDragEnter={stopDragDefaults}
                      onDragOver={stopDragDefaults}
                      onDrop={onDropSlot2}
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={() => fileRef2.current?.click()}
                        className={videoImageUploadSlotClass()}
                        aria-label={promptImage2Url ? "Change End frame" : "Upload End frame (optional)"}
                      >
                        {promptImage2Url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={promptImage2Url} alt={studioReferenceImageAlt("video")} className="absolute inset-0 size-full object-cover" />
                        ) : (
                          <>
                            <Upload className="size-5 opacity-60" />
                            <span className="mt-2 text-center text-xs font-medium text-zorixa-muted">
                              End frame
                              <span className="block text-[10px] font-normal text-zorixa-muted/80">
                                optional
                              </span>
                            </span>
                          </>
                        )}
                      </button>
                      {promptImage2Url ? (
                        <button
                          type="button"
                          onClick={() => onPromptImage2Change?.(null)}
                          className={cn(
                            "absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80",
                            "hover:bg-black hover:text-white"
                          )}
                          aria-label="Remove End frame"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                    ) : null}
                  </div>
                  {showSeedanceI2vTip ? (
                    <>
                      <SeedanceI2vReferenceTip className="w-full max-w-[312px] max-lg:hidden" />
                      <p className="hidden w-full text-[10px] leading-snug text-zorixa-muted max-lg:block">
                        Real faces may block on 2.0 — try{" "}
                        <span className="font-medium text-white/80">Seedance 1.5 Pro</span> or{" "}
                        <span className="font-medium text-white/80">Reference to Video</span>.
                      </p>
                    </>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <div
            className={cn(
              "flex min-w-0 flex-col",
              "flex-1"
            )}
          >
            <textarea
              ref={promptTextareaRef}
              suppressHydrationWarning
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={
                showReferenceMediaPanel
                  ? isLgUp
                    ? 3
                    : 2
                  : showTextOnlyPromptLayout
                    ? isLgUp
                      ? 3
                      : 2
                    : 2
              }
              placeholder={
                showAudioToVideoLayout
                  ? "Optional: expression, posture, scene style…"
                  : showReferenceLayout && showReferenceMediaPanel
                    ? "Use @image1 @video1 @audio1 in your scene — e.g. In @image1 the hero from @image2 walks through @video1 with mood from @audio1…"
                    : showReferenceLayout
                      ? "Describe the scene — e.g. image 1 is the character, image 2 is the background…"
                    : showWanCharacterSwapLayout
                      ? "Optional: scene notes — motion comes from the source video…"
                      : showMotionControlLayout
                        ? "Optional: scene style, lighting, background (motion comes from the clip)…"
                      : showWanV2vLayout
                        ? "Describe how to transform the source video…"
                        : showTextOnlyPromptLayout
                          ? "Describe the video you want to generate…"
                          : "Describe your image..."
              }
              className={cn(
                "w-full rounded-lg bg-[#0a0a0a] px-3 py-2 text-sm leading-snug text-white outline-none transition-shadow placeholder:text-zorixa-muted",
                "focus-visible:ring-2 focus-visible:ring-brand",
                showReferenceMediaPanel
                  ? "min-h-[88px] resize-none max-lg:min-h-[56px]"
                  : "resize-y max-lg:max-h-[4.5rem]"
              )}
            />
          </div>
          <div className="hidden min-w-[24px] shrink-0 lg:block" aria-hidden />
        </div>

          </div>

        {/* ROW 2 — controls (pinned on mobile for tall Seedance layouts) */}
        <div className="max-lg:shrink-0 lg:contents">
        <div className={cn("relative z-[120] flex shrink-0 items-end gap-2 overflow-visible max-lg:flex-col max-lg:items-stretch max-lg:gap-2.5 max-lg:border-t max-lg:border-white/10 max-lg:bg-[#0d0d14]/95 max-lg:pt-2", useStableDockHeight && "border-t border-white/5 pt-1.5")}>
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2 overflow-visible max-lg:gap-1.5">
          {/* MODEL */}
          <div className="flex items-center gap-2 overflow-visible">
            <span className={videoControlLabelClass}>Model</span>
            <div className="relative overflow-visible">
              <button
                ref={modelTriggerRef}
                type="button"
                onClick={() => openOnly("model")}
                className={cn(
                  triggerClass,
                  open === "model" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
                )}
              >
                <span className="inline-flex max-w-[160px] items-center gap-2 truncate max-lg:max-w-[min(36vw,124px)]">
                  <ModelBrandLogo composerId={selectedModel.id} />
                  <span className="truncate">{selectedModel.label}</span>
                </span>
                <ChevronUp
                  className={cn(
                    "size-3.5 shrink-0 text-zorixa-muted transition-transform",
                    open === "model" && "rotate-180"
                  )}
                />
              </button>
              {modelMenuMounted && open === "model" && modelMenuStyle
                ? createPortal(
                    <AnimatePresence>
                      <motion.div
                        ref={modelMenuRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{ ...modelMenuStyle, transformOrigin: "bottom left" }}
                        className={modelMenuPanelClass}
                      >
                        {pickerModels.map((m) => (
                          <ModelRow
                            key={m.id}
                            model={m}
                            active={m.id === composerModelId}
                            onPick={() => {
                              if (m.locked) return;
                              onComposerModelChange(m.id);
                              setOpen(null);
                            }}
                          />
                        ))}
                      </motion.div>
                    </AnimatePresence>,
                    document.body
                  )
                : null}
            </div>
          </div>

          {showMotionControlLayout ? (
            <>
              <motion.div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
                  Framing
                </span>
                <motion.div className="flex gap-1">
                  {(["image", "video"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onCharacterOrientationChange?.(mode)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors",
                        characterOrientation === mode
                          ? "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.15)] text-white"
                          : "border-white/10 bg-[#1a1a24] text-zorixa-muted hover:text-white"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </motion.div>
              </div>
              <motion.div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
              <div className="flex items-center gap-2">
                <span className={videoControlLabelClass}>Ref audio</span>
                <GenerateAudioToggle
                  on={keepOriginalSound}
                  onChange={(v) => onKeepOriginalSoundChange?.(v)}
                />
              </div>
            </>
          ) : null}

          {showGenerateAudioControl ? (
            <>
              <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
              <div className="flex items-center gap-2">
                <span
                  className={videoControlLabelClass}
                  title="Built-in soundtrack on output (Atlas generate_audio). Wan 2.7 defaults On like Atlas playground."
                >
                  Soundtrack
                </span>
                <GenerateAudioToggle on={generateAudioEffective} onChange={onGenerateAudioChange} />
              </div>
            </>
          ) : null}

          {showWan26ShotTypeControl ? (
            <>
              <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
              <div className="flex flex-col gap-1">
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted"
                  title="Single: one continuous shot. Multi: Atlas splits your prompt into cohesive multi-shot scenes (enables prompt expansion)."
                >
                  Shot Type
                  <CircleHelp className="size-3 text-zorixa-muted/80" aria-hidden />
                </span>
                <div className="flex gap-1">
                  {(["multi", "single"] as const).map((shot) => (
                    <button
                      key={shot}
                      type="button"
                      onClick={() => onWan26ShotTypeChange?.(shot)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        wan26ShotType === shot
                          ? "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.15)] text-white"
                          : "border-white/10 bg-[#1a1a24] text-zorixa-muted hover:text-white"
                      )}
                    >
                      {shot}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {showKlingV3ShotTypeControl ? (
            <>
              <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
              <div className="flex flex-col gap-1">
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted"
                  title="Multi-shot: Kling 3.0 Pro plans linked camera shots from your prompt (Atlas multi_shot + intelligent). Works on Text to Video and Image to Video."
                >
                  Shots
                  <CircleHelp className="size-3 text-zorixa-muted/80" aria-hidden />
                </span>
                <div className="flex gap-1">
                  {(
                    [
                      { id: "single" as const, label: "Single" },
                      { id: "multi" as const, label: "Multi-shot" }
                    ] as const
                  ).map((shot) => (
                    <button
                      key={shot.id}
                      type="button"
                      onClick={() => onKlingV3ShotModeChange?.(shot.id)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        klingV3ShotMode === shot.id
                          ? "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.15)] text-white"
                          : "border-white/10 bg-[#1a1a24] text-zorixa-muted hover:text-white"
                      )}
                    >
                      {shot.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {!hideModeAspectControls && !showGeminiLayout && !showGrokLayout && !showHailuoLayout ? (
          <>
          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

          {/* MODE */}
          <div className="flex items-center gap-2">
            <span className={videoControlLabelClass}>Mode</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => openOnly("mode")}
                className={cn(
                  triggerClass,
                  open === "mode" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
                )}
              >
                <span className="max-w-[100px] truncate">{modeValue}</span>
                <ChevronUp
                  className={cn(
                    "size-3.5 shrink-0 text-zorixa-muted transition-transform",
                    open === "mode" && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {open === "mode" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{ transformOrigin: "bottom left" }}
                    className={cn(dropupPanelClass, "left-0 min-w-[200px] py-1")}
                  >
                    {MODE_DROPUP_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          onModeChange(opt);
                          setOpen(null);
                        }}
                        className={cn(
                          "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors",
                          opt === modeValue ? "bg-zorixa-tab text-white" : "text-white/95 hover:bg-[rgba(131,56,235,0.1)]"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          </>
          ) : null}

          {showSpeedTierControl ? (
          <>
          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
          <div className="flex items-center gap-2">
            <span
              className={videoControlLabelClass}
              title={
                showWanCharacterSwapLayout
                  ? "Std = wan-std · Pro = wan-pro (Atlas animate-mix)"
                  : characterSwapBar
                    ? "Pro = kling-v2.6-pro/motion-control · Std = cheaper Std tier on Atlas"
                    : composerModelId === "kling-3-pro"
                    ? "Standard = Kling Pro · Fast = Kling Std (cheaper)"
                    : "Standard = full Seedance · Fast = Seedance fast tier"
              }
            >
              {characterSwapBar ? "Tier" : "Speed"}
            </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => openOnly("standard")}
              className={cn(
                triggerClass,
                open === "standard" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
              )}
            >
              <span>
                {atlasSpeedTierUiLabel(
                  composerModelId,
                  durationStandard === "Fast" ? "Fast" : "Standard"
                )}
              </span>
              <ChevronUp
                className={cn(
                  "size-3.5 shrink-0 text-zorixa-muted transition-transform",
                  open === "standard" && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {open === "standard" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ transformOrigin: "bottom left" }}
                  className={cn(dropupPanelClass, "left-0 min-w-[140px] py-1")}
                >
                  {STANDARD_DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        onDurationStandardChange(d);
                        setOpen(null);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm transition-colors",
                        d === durationStandard ? "bg-zorixa-tab text-white" : "text-white/95 hover:bg-[rgba(131,56,235,0.1)]"
                      )}
                    >
                      {atlasSpeedTierUiLabel(composerModelId, d)}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          </div>
          </>
          ) : null}

          {!showAudioToVideoLayout &&
          !showWanCharacterSwapLayout &&
          !showMotionControlLayout &&
          !hideHailuoT2vTimeControl ? (
          <>
          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

          {/* Time */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openOnly("time")}
              className={cn(
                triggerClass,
                open === "time" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
              )}
            >
              <span className="tabular-nums">{timeSeconds}s</span>
              <ChevronUp
                className={cn("size-3.5 shrink-0 text-zorixa-muted transition-transform", open === "time" && "rotate-180")}
              />
            </button>
            <AnimatePresence>
              {open === "time" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ transformOrigin: "bottom left" }}
                  className={cn(dropupPanelClass, "left-0 max-h-52 min-w-[100px] overflow-y-auto py-1")}
                >
                  {timeOptionsForTab.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        onTimeSecondsChange(t);
                        setOpen(null);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm tabular-nums transition-colors",
                        t === timeSeconds ? "bg-zorixa-tab text-white" : "text-white/95 hover:bg-[rgba(131,56,235,0.1)]"
                      )}
                    >
                      {t}s
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          </>
          ) : null}

          {!hideModeAspectControls && !showHailuoLayout ? (
          <>
          {/* Aspect */}
          <div className="flex items-center gap-2">
            <span className={videoControlLabelClass}>Aspect</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => openOnly("aspect")}
                className={cn(
                  triggerClass,
                  open === "aspect" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
                )}
              >
                <span>{aspect}</span>
                <ChevronUp
                  className={cn(
                    "size-3.5 shrink-0 text-zorixa-muted transition-transform",
                    open === "aspect" && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {open === "aspect" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{ transformOrigin: "bottom left" }}
                    className={cn(dropupPanelClass, "left-0 min-w-[100px] py-1")}
                  >
                    {aspectOptionsForTab.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          onAspectChange(a);
                          setOpen(null);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm transition-colors",
                          a === aspect ? "bg-zorixa-tab text-white" : "text-white/95 hover:bg-[rgba(131,56,235,0.1)]"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          </>
          ) : null}

          {showResolutionControl ? (
          <>
          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
          {/* Resolution */}
          <div className="flex items-center gap-2">
            <span className={videoControlLabelClass}>Resolution</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => openOnly("resolution")}
                className={cn(
                  triggerClass,
                  open === "resolution" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
                )}
              >
                <span>{resolution}</span>
                <ChevronUp
                  className={cn(
                    "size-3.5 shrink-0 text-zorixa-muted transition-transform",
                    open === "resolution" && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {open === "resolution" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{ transformOrigin: "bottom left" }}
                    className={cn(dropupPanelClass, "left-0 min-w-[140px] py-1")}
                  >
                    {resolutionOptions.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          onResolutionChange(r.id);
                          setOpen(null);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors",
                          r.id === resolution ? "bg-zorixa-tab text-white" : "text-white/95 hover:bg-[rgba(131,56,235,0.1)]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {r.label}
                          {r.newBadge ? <Badge variant="newTeal">NEW</Badge> : null}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          </>
          ) : null}

          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2.5 pb-0.5 max-lg:ml-0 max-lg:w-full max-lg:justify-between max-lg:border-t max-lg:border-white/10 max-lg:pt-2">
            <span className="text-sm font-semibold tabular-nums text-white/90">{creditsLine}</span>
            <motion.button
              type="button"
              disabled={loadingGenerate}
              whileHover={loadingGenerate ? undefined : { scale: 1.02 }}
              whileTap={loadingGenerate ? undefined : { scale: 0.98 }}
              onClick={emitGenerate}
              className="inline-flex min-w-[140px] shrink-0 items-center justify-center gap-2 rounded-xl bg-zorixa-tab px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:bg-[#1d4ed8] disabled:opacity-60 max-lg:min-h-[44px] max-lg:flex-1 max-lg:min-w-0"
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
      <VideoLightbox
        open={uploadVideoLightbox != null}
        src={uploadVideoLightbox?.src ?? null}
        title={uploadVideoLightbox?.title}
        onClose={() => setUploadVideoLightbox(null)}
      />
    </>
  );
}

function ModelRow({
  model,
  active,
  onPick
}: {
  model: BottomBarModel;
  active: boolean;
  onPick: () => void;
}) {
  const disabled = model.locked;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && active && "bg-zorixa-selected text-white",
        !disabled && !active && "text-white/95 hover:bg-[rgba(131,56,235,0.1)]",
        disabled && "hover:bg-transparent"
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <ModelBrandLogo composerId={model.id} />
        <span className="truncate">{model.label}</span>
        {model.locked ? <span aria-hidden>🔒</span> : null}
        {model.badge === "newTeal" ? <Badge variant="newTeal">NEW</Badge> : null}
        {model.badge === "pro" ? <Badge variant="pro">PRO</Badge> : null}
      </span>
      {active && !disabled ? <Check className="size-4 shrink-0 text-white" /> : null}
    </button>
  );
}
