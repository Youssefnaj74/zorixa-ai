"use client";

import { Check, ChevronUp, Sparkles, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ImageActionTabsRow, type ImageActionTab } from "@/components/image/ImageActionTabsRow";
import type { ImageStudioLock } from "@/lib/studio-catalog-link";
import {
  GPT_IMAGE_2_SIZE_GROUPS,
  IMAGE_ASPECTS,
  IMAGE_CAMERA_STYLES,
  IMAGE_RESOLUTIONS,
  SEEDREAM_ATLAS_SIZE_GROUPS
} from "@/components/image/image-bottom-bar-constants";
import { MODEL_OPTIONS, type ModelOption } from "@/components/ui/ModelDropdown";
import { ModelBrandLogo } from "@/components/ui/ModelBrandLogo";
import { getAtlasImageModelLimits, getImageBatchOptions, imageComposerSupportedOnActionTab } from "@/lib/atlas-image-model-ids";
import { getImageI2iUploadSlots } from "@/lib/image-i2i-model-slots";
import { IMAGE_I2I_DOCK_HEIGHT } from "@/lib/composer-dock-height";
import { useIsLgUp } from "@/lib/hooks/use-studio-nav-offset";
import { studioReferenceImageAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

export type ImageGenerateContext = {
  promptText: string;
  actionTab: ImageActionTab;
  aspectRatio: string;
  resolution: string;
  referenceUrls: string[];
  batchCount: number;
  cameraStyle: string;
};

export type ImageBottomBarProps = {
  prompt: string;
  onPromptChange: (v: string) => void;
  actionTab: ImageActionTab;
  onActionTabChange: (tab: ImageActionTab) => void;
  referenceUrls: string[];
  onReferenceUrlsChange: (urls: string[]) => void;
  modelId: string;
  onModelChange: (id: string) => void;
  cameraStyle: string;
  onCameraStyleChange: (v: string) => void;
  resolution: string;
  onResolutionChange: (v: string) => void;
  aspect: string;
  onAspectChange: (v: string) => void;
  batchCount: number;
  onBatchCountChange: (count: number) => void;
  creditsLine: string;
  loadingGenerate: boolean;
  onGenerate: (ctx: ImageGenerateContext) => void | Promise<void>;
  onHeightChange?: (height: number) => void;
  /** When set (from /tools), tab + model are fixed to this tool card. */
  studioLock?: ImageStudioLock | null;
};

type OpenPanel =
  | "camera"
  | "model"
  | "resolution"
  | "aspect"
  | "gptSize"
  | "seedreamSize"
  | "batch"
  | null;

const dropupPanelClass =
  "absolute bottom-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] shadow-glow-lg";

const triggerClass =
  "inline-flex h-9 min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] px-3 text-xs font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand";

function AspectRatioIcon({ ratio }: { ratio: string }) {
  const box = "rounded-[3px] border border-current opacity-90";
  switch (ratio) {
    case "1:1":
      return <span className={cn(box, "inline-block size-[22px] align-middle")} aria-hidden />;
    case "16:9":
      return <span className={cn(box, "inline-block h-[11px] w-[22px] align-middle")} aria-hidden />;
    case "9:16":
      return <span className={cn(box, "inline-block h-[22px] w-[11px] align-middle")} aria-hidden />;
    case "4:3":
      return <span className={cn(box, "inline-block h-[14px] w-[19px] align-middle")} aria-hidden />;
    case "3:4":
      return <span className={cn(box, "inline-block h-[19px] w-[14px] align-middle")} aria-hidden />;
    case "2:3":
      return <span className={cn(box, "inline-block h-[20px] w-[13px] align-middle")} aria-hidden />;
    case "3:2":
      return <span className={cn(box, "inline-block h-[13px] w-[20px] align-middle")} aria-hidden />;
    default:
      return <span className={cn(box, "inline-block size-[18px] align-middle")} aria-hidden />;
  }
}

function ModelPickRow({
  model,
  active,
  onPick
}: {
  model: ModelOption;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      title={model.title ?? model.label}
      onClick={onPick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        active ? "bg-brand/15 text-white" : "text-white/90 hover:bg-white/5"
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <ModelBrandLogo composerId={model.id} />
        <span className="truncate">{model.label}</span>
        {model.badge}
      </span>
      {active ? <Check className="size-4 shrink-0 text-brand-light" /> : null}
    </button>
  );
}

export function ImageBottomBar({
  prompt,
  onPromptChange,
  actionTab,
  onActionTabChange,
  referenceUrls,
  onReferenceUrlsChange,
  modelId,
  onModelChange,
  cameraStyle,
  onCameraStyleChange,
  resolution,
  onResolutionChange,
  aspect,
  onAspectChange,
  batchCount,
  onBatchCountChange,
  creditsLine,
  loadingGenerate,
  onGenerate,
  onHeightChange,
  studioLock = null
}: ImageBottomBarProps) {
  const isLgUp = useIsLgUp();
  const [open, setOpen] = useState<OpenPanel>(null);
  const bottomBarRef = useRef<HTMLElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const promptMirrorRef = useRef(prompt);
  promptMirrorRef.current = prompt;

  const pickerModels = MODEL_OPTIONS.filter((m) =>
    imageComposerSupportedOnActionTab(m.id, actionTab)
  );
  const selectedModel =
    pickerModels.find((m) => m.id === modelId) ?? pickerModels[0] ?? MODEL_OPTIONS[0];
  const maxRefs = getAtlasImageModelLimits(modelId).maxImages;
  const showUploads = actionTab === "Image to Image";
  const i2iSlots = useMemo(
    () => (showUploads ? getImageI2iUploadSlots(modelId).slice(0, maxRefs) : []),
    [maxRefs, modelId, showUploads]
  );
  const batchOptions = getImageBatchOptions(modelId);
  const showBatchPicker = batchOptions.length > 1;
  const isGptImage2 = modelId === "gpt-image-2";
  const isSeedream = modelId === "seedream-5";
  const lockedFromTools = studioLock != null;
  const promptPlaceholder = lockedFromTools
    ? `Describe your ${selectedModel.label} image…`
    : "Describe your image...";

  const useStableDockHeight = showUploads && isLgUp;
  const stableDockHeight = IMAGE_I2I_DOCK_HEIGHT;

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
  }, [onHeightChange, stableDockHeight, useStableDockHeight, showUploads, referenceUrls.length, actionTab]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!bottomBarRef.current?.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const openOnly = useCallback((panel: OpenPanel) => {
    setOpen((prev) => (prev === panel ? null : panel));
  }, []);

  const stopDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const setRefAt = useCallback(
    (index: number, url: string | null) => {
      const next = [...referenceUrls];
      if (url) {
        next[index] = url;
      } else {
        next.splice(index, 1);
      }
      onReferenceUrlsChange(next.slice(0, maxRefs));
    },
    [maxRefs, onReferenceUrlsChange, referenceUrls]
  );

  const applyFile = useCallback(
    (index: number, file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      setRefAt(index, url);
    },
    [setRefAt]
  );

  useEffect(() => {
    if (!showUploads) return;
    if (referenceUrls.length <= i2iSlots.length) return;
    onReferenceUrlsChange(referenceUrls.slice(0, i2iSlots.length));
  }, [i2iSlots.length, onReferenceUrlsChange, referenceUrls, showUploads]);

  const emitGenerate = useCallback(() => {
    const fromDom = promptTextareaRef.current?.value;
    const promptText =
      fromDom !== undefined && fromDom !== null ? fromDom : promptMirrorRef.current;

    void onGenerate({
      promptText,
      actionTab,
      aspectRatio: aspect,
      resolution,
      referenceUrls,
      batchCount,
      cameraStyle
    });
  }, [actionTab, aspect, batchCount, cameraStyle, onGenerate, referenceUrls, resolution]);

  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  return (
    <footer
      ref={bottomBarRef}
      style={useStableDockHeight ? { minHeight: stableDockHeight } : undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-[rgba(131,56,235,0.15)] bg-[#0d0d14]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[12px]",
        "px-5 py-3 font-body max-lg:overflow-hidden max-lg:px-3 max-lg:py-2.5",
        showUploads
          ? "max-lg:max-h-[min(70dvh,580px)] lg:max-h-[min(40vh,240px)]"
          : "max-lg:max-h-[min(58dvh,480px)]"
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1920px] flex-col gap-3 max-lg:min-h-0 max-lg:flex-1",
          useStableDockHeight && "min-h-0 flex-1"
        )}
      >
        {lockedFromTools ? (
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
              {studioLock.tab}
            </span>
            <span className="h-4 w-px bg-white/10" aria-hidden />
            <span className="truncate font-display text-sm font-semibold text-white">
              <span className="inline-flex items-center gap-2">
                <ModelBrandLogo composerId={selectedModel.id} size={18} />
                {selectedModel.label}
              </span>
            </span>
            {selectedModel.badge ? <span className="shrink-0">{selectedModel.badge}</span> : null}
          </div>
        ) : (
          <div className="shrink-0">
            <ImageActionTabsRow
              active={actionTab}
              onChange={onActionTabChange}
              className="h-11 min-h-[44px] w-full"
            />
          </div>
        )}

        <div className="max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:gap-2 lg:contents">
          {showUploads ? (
            <div className="shrink-0 max-lg:w-full lg:hidden">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
                Prompt
              </span>
              <textarea
                suppressHydrationWarning
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                rows={2}
                placeholder={promptPlaceholder}
                style={{ resize: "none" }}
                className={cn(
                  "scrollbar-hide w-full resize-none rounded-lg bg-[#0a0a0a] px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-zorixa-muted",
                  "focus-visible:ring-2 focus-visible:ring-brand",
                  "min-h-[4rem]"
                )}
              />
            </div>
          ) : null}

          {showUploads ? (
            <div className="shrink-0 max-lg:w-full lg:hidden">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
                Reference{ i2iSlots.length > 1 ? "s" : "" }
              </span>
              {i2iSlots.map((slot, idx) => (
                <input
                  key={`mobile-${slot.label}-${idx}`}
                  ref={(el) => {
                    fileRefs.current[idx] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) applyFile(idx, f);
                    e.target.value = "";
                  }}
                />
              ))}
              <div
                className={cn(
                  "grid w-full gap-2",
                  i2iSlots.length > 1 ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                {i2iSlots.map((slot, idx) => {
                  const url = referenceUrls[idx] ?? null;
                  return (
                    <div
                      key={`mobile-slot-${slot.label}-${idx}`}
                      className="relative min-h-[100px]"
                      onDragEnter={stopDrag}
                      onDragOver={stopDrag}
                      onDrop={(e) => {
                        stopDrag(e);
                        const f = e.dataTransfer.files?.[0];
                        if (f) applyFile(idx, f);
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => fileRefs.current[idx]?.click()}
                        className={cn(
                          "relative flex h-[100px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl",
                          "border border-dashed border-white/20 bg-black/40 text-zorixa-muted transition-colors",
                          "hover:border-white/30 hover:bg-black/55"
                        )}
                      >
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt={studioReferenceImageAlt("image")}
                            className="absolute inset-0 size-full object-contain bg-black/50"
                          />
                        ) : (
                          <>
                            <Upload className="size-4 opacity-60" />
                            <span className="mt-1 text-[11px] font-medium text-zorixa-muted">{slot.label}</span>
                            {slot.hint ? (
                              <span className="mt-0.5 max-w-full truncate px-1 text-[9px] text-zorixa-muted/70">
                                {slot.hint}
                              </span>
                            ) : null}
                          </>
                        )}
                      </button>
                      {url ? (
                        <button
                          type="button"
                          onClick={() => setRefAt(idx, null)}
                          className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80 hover:bg-black hover:text-white"
                          aria-label={`Remove ${slot.label}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-y-contain lg:contents">
        <div
          className={cn(
            "flex min-h-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-3",
            showUploads && "max-lg:hidden",
            useStableDockHeight && "flex-1 overflow-y-auto overscroll-y-contain"
          )}
        >
          {showUploads ? (
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start">
              {i2iSlots.map((slot, idx) => (
                <input
                  key={`${slot.label}-${idx}`}
                  ref={(el) => {
                    fileRefs.current[idx] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) applyFile(idx, f);
                    e.target.value = "";
                  }}
                />
              ))}
              <div
                className={cn(
                  "grid gap-3 max-lg:w-full",
                  i2iSlots.length > 1 ? "grid-cols-2 max-lg:grid-cols-2" : "grid-cols-1"
                )}
              >
                {i2iSlots.map((slot, idx) => {
                  const url = referenceUrls[idx] ?? null;
                  return (
                  <div
                    key={`${slot.label}-${idx}`}
                    className="relative"
                    onDragEnter={stopDrag}
                    onDragOver={stopDrag}
                    onDrop={(e) => {
                      stopDrag(e);
                      const f = e.dataTransfer.files?.[0];
                      if (f) applyFile(idx, f);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => fileRefs.current[idx]?.click()}
                      className={cn(
                        "relative flex h-[88px] w-[150px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl",
                        "border border-dashed border-white/20 bg-black/40 text-zorixa-muted transition-colors",
                        "hover:border-white/30 hover:bg-black/55"
                      )}
                    >
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={studioReferenceImageAlt("image")}
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : (
                        <>
                          <Upload className="size-5 opacity-60" />
                          <span className="mt-2 text-xs font-medium text-zorixa-muted">{slot.label}</span>
                          {slot.hint ? (
                            <span className="mt-0.5 max-w-[130px] truncate px-1 text-[10px] text-zorixa-muted/70">
                              {slot.hint}
                            </span>
                          ) : null}
                        </>
                      )}
                    </button>
                    {url ? (
                      <button
                        type="button"
                        onClick={() => setRefAt(idx, null)}
                        className="absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80 hover:bg-black hover:text-white"
                        aria-label={`Remove ${slot.label}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <textarea
              ref={promptTextareaRef}
              suppressHydrationWarning
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={2}
              placeholder={promptPlaceholder}
              style={{ resize: "none" }}
              className={cn(
                "scrollbar-hide w-full resize-none rounded-lg bg-[#0a0a0a] px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-zorixa-muted",
                "focus-visible:ring-2 focus-visible:ring-brand"
              )}
            />
          </div>
        </div>

        <div
          className={cn(
            "flex shrink-0 flex-wrap items-center gap-3 max-lg:flex-row max-lg:flex-wrap max-lg:items-center max-lg:gap-1.5 max-lg:border-t max-lg:border-white/10 max-lg:pt-2 max-lg:pb-1",
            useStableDockHeight && "border-t border-white/5 pt-2"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">Model</span>
            {lockedFromTools ? (
              <span
                title={selectedModel.title ?? selectedModel.label}
                className={cn(triggerClass, "cursor-default border-[rgba(131,56,235,0.35)] bg-[rgba(131,56,235,0.08)]")}
              >
                <ModelBrandLogo composerId={selectedModel.id} />
                <span className="max-w-[180px] truncate">{selectedModel.label}</span>
              </span>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  title={selectedModel.title ?? selectedModel.label}
                  onClick={() => openOnly("model")}
                  className={cn(triggerClass, open === "model" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]")}
                >
                  <span className="inline-flex max-w-[140px] items-center gap-2 truncate">
                    <ModelBrandLogo composerId={selectedModel.id} />
                    <span className="truncate">{selectedModel.label}</span>
                  </span>
                  <ChevronUp className={cn("size-3.5 text-zorixa-muted", open === "model" && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {open === "model" ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{ transformOrigin: "bottom left" }}
                      className={cn(dropupPanelClass, "left-0 min-w-[240px] py-1")}
                    >
                      {pickerModels.map((m) => (
                        <ModelPickRow
                          key={m.id}
                          model={m}
                          active={m.id === modelId}
                          onPick={() => {
                            onModelChange(m.id);
                            setOpen(null);
                          }}
                        />
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

          <div className="relative">
            <span className="mr-2 hidden text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted sm:inline">
              Camera
            </span>
            <button
              type="button"
              onClick={() => openOnly("camera")}
              className={cn(triggerClass, open === "camera" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]")}
            >
              <span className="truncate">{cameraStyle}</span>
              <ChevronUp className={cn("size-3.5 text-zorixa-muted", open === "camera" && "rotate-180")} />
            </button>
            <AnimatePresence>
              {open === "camera" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(dropupPanelClass, "left-0 min-w-[180px] py-1")}
                >
                  {IMAGE_CAMERA_STYLES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onCameraStyleChange(c);
                        setOpen(null);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm",
                        c === cameraStyle ? "bg-zorixa-tab text-white" : "text-white/95 hover:bg-white/5"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {isSeedream ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => openOnly("seedreamSize")}
                className={cn(
                  triggerClass,
                  open === "seedreamSize" &&
                    "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <AspectRatioIcon ratio={aspect} />
                  <span className="tabular-nums">
                    {resolution} · {aspect}
                  </span>
                </span>
                <ChevronUp
                  className={cn("size-3.5 text-zorixa-muted", open === "seedreamSize" && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {open === "seedreamSize" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ transformOrigin: "bottom left" }}
                    className={cn(
                      dropupPanelClass,
                      "left-0 max-h-[min(70vh,480px)] w-[260px] overflow-y-auto py-2"
                    )}
                  >
                    {SEEDREAM_ATLAS_SIZE_GROUPS.map((group, gi) => (
                      <div
                        key={group.tier}
                        className={cn(
                          "px-2 pb-2",
                          gi < SEEDREAM_ATLAS_SIZE_GROUPS.length - 1 && "border-b border-white/5"
                        )}
                      >
                        <div className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
                          {group.tier}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {group.options.map((opt) => {
                            const selected =
                              resolution === group.tier && aspect === opt.aspect;
                            return (
                              <button
                                key={`${group.tier}-${opt.aspect}`}
                                type="button"
                                onClick={() => {
                                  onResolutionChange(group.tier);
                                  onAspectChange(opt.aspect);
                                  setOpen(null);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                                  selected
                                    ? "border border-brand-light/50 bg-brand/10 text-white"
                                    : "border border-transparent text-white/90 hover:bg-white/5"
                                )}
                              >
                                {selected ? (
                                  <Check className="size-4 shrink-0 text-brand-light" />
                                ) : (
                                  <span className="inline-flex w-4 shrink-0 justify-center" aria-hidden />
                                )}
                                <AspectRatioIcon ratio={opt.aspect} />
                                <span className="tabular-nums">{opt.aspect}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : isGptImage2 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => openOnly("gptSize")}
                className={cn(
                  triggerClass,
                  open === "gptSize" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <AspectRatioIcon ratio={aspect} />
                  <span className="tabular-nums">
                    {resolution} · {aspect}
                  </span>
                </span>
                <ChevronUp className={cn("size-3.5 text-zorixa-muted", open === "gptSize" && "rotate-180")} />
              </button>
              <AnimatePresence>
                {open === "gptSize" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ transformOrigin: "bottom left" }}
                    className={cn(
                      dropupPanelClass,
                      "left-0 max-h-[min(70vh,440px)] w-[232px] overflow-y-auto py-2"
                    )}
                  >
                    {GPT_IMAGE_2_SIZE_GROUPS.map((group, gi) => (
                      <div
                        key={group.tier}
                        className={cn("px-2 pb-2", gi < GPT_IMAGE_2_SIZE_GROUPS.length - 1 && "border-b border-white/5")}
                      >
                        <div className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
                          {group.tier}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {group.aspects.map((ar) => {
                            const selected = resolution === group.tier && aspect === ar;
                            return (
                              <button
                                key={`${group.tier}-${ar}`}
                                type="button"
                                onClick={() => {
                                  onResolutionChange(group.tier);
                                  onAspectChange(ar);
                                  setOpen(null);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                                  selected
                                    ? "border border-brand-light/50 bg-brand/10 text-white"
                                    : "border border-transparent text-white/90 hover:bg-white/5"
                                )}
                              >
                                {selected ? (
                                  <Check className="size-4 shrink-0 text-brand-light" />
                                ) : (
                                  <span className="inline-flex w-4 shrink-0 justify-center" aria-hidden />
                                )}
                                <AspectRatioIcon ratio={ar} />
                                <span className="tabular-nums">{ar}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <div className="relative">
                <button type="button" onClick={() => openOnly("resolution")} className={triggerClass}>
                  <span>{resolution}</span>
                  <ChevronUp className={cn("size-3.5", open === "resolution" && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {open === "resolution" ? (
                    <motion.div className={cn(dropupPanelClass, "left-0 min-w-[100px] py-1")}>
                      {IMAGE_RESOLUTIONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            onResolutionChange(r);
                            setOpen(null);
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-left text-sm",
                            r === resolution ? "bg-zorixa-tab text-white" : "hover:bg-white/5"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button type="button" onClick={() => openOnly("aspect")} className={triggerClass}>
                  <span>{aspect}</span>
                  <ChevronUp className={cn("size-3.5", open === "aspect" && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {open === "aspect" ? (
                    <motion.div className={cn(dropupPanelClass, "left-0 min-w-[120px] py-1")}>
                      {IMAGE_ASPECTS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            onAspectChange(a);
                            setOpen(null);
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-left text-sm",
                            a === aspect ? "bg-zorixa-tab text-white" : "hover:bg-white/5"
                          )}
                        >
                          {a}
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </>
          )}

          {showBatchPicker ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => openOnly("batch")}
                className={cn(
                  triggerClass,
                  open === "batch" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
                )}
                title="Images per generation"
              >
                <span className="tabular-nums">{batchCount}×</span>
                <ChevronUp className={cn("size-3.5 text-zorixa-muted", open === "batch" && "rotate-180")} />
              </button>
              <AnimatePresence>
                {open === "batch" ? (
                  <motion.div className={cn(dropupPanelClass, "left-0 min-w-[88px] py-1")}>
                    {batchOptions.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          onBatchCountChange(n);
                          setOpen(null);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm tabular-nums",
                          n === batchCount ? "bg-zorixa-tab text-white" : "hover:bg-white/5"
                        )}
                      >
                        <span>{n} image{n > 1 ? "s" : ""}</span>
                        {n === batchCount ? <Check className="size-4 text-brand-light" /> : null}
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}

          <div
            className={cn(
              "ml-auto flex shrink-0 items-center gap-2.5 max-lg:ml-0 max-lg:w-full max-lg:justify-between max-lg:border-t max-lg:border-white/10 max-lg:pt-2",
              showUploads && "max-lg:hidden"
            )}
          >
            <span className="text-sm font-semibold tabular-nums text-white/90">{creditsLine}</span>
            <motion.button
              type="button"
              disabled={loadingGenerate}
              onClick={emitGenerate}
              whileHover={loadingGenerate ? undefined : { scale: 1.02 }}
              whileTap={loadingGenerate ? undefined : { scale: 0.98 }}
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

        {showUploads ? (
          <div className="flex shrink-0 items-center gap-2.5 max-lg:w-full max-lg:justify-between max-lg:border-t max-lg:border-white/10 max-lg:bg-[#0d0d14]/95 max-lg:pt-2 lg:hidden">
            <span className="text-sm font-semibold tabular-nums text-white/90">{creditsLine}</span>
            <motion.button
              type="button"
              disabled={loadingGenerate}
              onClick={emitGenerate}
              whileHover={loadingGenerate ? undefined : { scale: 1.02 }}
              whileTap={loadingGenerate ? undefined : { scale: 0.98 }}
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
        ) : null}
        </div>
      </div>
    </footer>
  );
}
