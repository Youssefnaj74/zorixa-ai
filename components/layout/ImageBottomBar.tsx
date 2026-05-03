"use client";

import { Check, ChevronDown, ChevronUp, Sparkles, Upload } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { MODEL_OPTIONS, ModelLimitPill, type ModelOption } from "@/components/ui/ModelDropdown";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

const CAMERA_STYLES = ["None", "iPhone Selfie", "Mirror Selfie", "Top Down View", "Full Bodyshot"] as const;
const RESOLUTIONS = ["2K", "4K", "1K"] as const;
const ASPECTS = ["Auto", "1:1", "16:9", "9:16", "4:3"] as const;

/** Max simultaneous images per model (grid size). */
const MODEL_MAX_IMAGES: Record<string, number> = {
  "gpt-image-2": 16,
  "nano-banana-2": 14,
  "nano-banana": 8,
  enhancor: 4,
  "seedream-5": 10,
  "grok-imagine": 1
};

function defaultBatchCountForModel(modelId: string): number {
  if (modelId === "gpt-image-2") return 16;
  return 1;
}

function getMaxImages(modelId: string): number {
  return MODEL_MAX_IMAGES[modelId] ?? 1;
}

/** Dropup panels: 12px radius, dark card, purple border (matches Video bottom bar). */
const dropupPanelClass =
  "absolute bottom-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] shadow-glow-lg";

const triggerClass =
  "inline-flex h-9 min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] px-3 text-xs font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand";

export type ImageBottomBarProps = {
  prompt: string;
  onPromptChange: (v: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (v: string) => void;
  showNegative: boolean;
  onToggleNegative: () => void;
  referencePreviewUrl: string | null;
  onReferenceFile: (file: File) => void;
  modelId: string;
  onModelChange: (id: string) => void;
  resolution: string;
  onResolutionChange: (v: string) => void;
  aspect: string;
  onAspectChange: (v: string) => void;
  cameraStyle: string;
  onCameraStyleChange: (v: string) => void;
  webSearch: boolean;
  onWebSearchChange: (v: boolean) => void;
  creditsLabel: string;
  loading: boolean;
  onGenerate: () => void;
  onHeightChange?: (height: number) => void;
};

type OpenPanel = "camera" | "model" | "resolution" | "aspect" | null;

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
      onClick={onPick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        active ? "bg-brand/15 text-white" : "text-white/90 hover:bg-white/5"
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{model.label}</span>
        {model.badge}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {model.limitShort ? <ModelLimitPill>{model.limitShort}</ModelLimitPill> : null}
        {active ? <Check className="size-4 shrink-0 text-brand-light" /> : null}
      </span>
    </button>
  );
}

export function ImageBottomBar({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  showNegative,
  onToggleNegative,
  referencePreviewUrl,
  onReferenceFile,
  modelId,
  onModelChange,
  resolution,
  onResolutionChange,
  aspect,
  onAspectChange,
  cameraStyle,
  onCameraStyleChange,
  webSearch,
  onWebSearchChange,
  creditsLabel,
  loading,
  onGenerate,
  onHeightChange
}: ImageBottomBarProps) {
  const [open, setOpen] = useState<OpenPanel>(null);
  const bottomBarRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [batchCount, setBatchCount] = useState(() => defaultBatchCountForModel(modelId));

  const selectedModel = MODEL_OPTIONS.find((m) => m.id === modelId) ?? MODEL_OPTIONS[0];
  const maxImages = getMaxImages(modelId);
  const showImageCountGrid = maxImages > 1;

  useEffect(() => {
    setBatchCount(defaultBatchCountForModel(modelId));
  }, [modelId]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!bottomBarRef.current?.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const el = bottomBarRef.current;
    if (!el || !onHeightChange) return;

    function measure() {
      const node = bottomBarRef.current;
      if (node) onHeightChange?.(node.offsetHeight);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeightChange]);

  const openOnly = useCallback((panel: OpenPanel) => {
    setOpen((prev) => (prev === panel ? null : panel));
  }, []);

  const stopDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onReferenceFile(f);
      e.target.value = "";
    },
    [onReferenceFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      stopDrag(e);
      const f = e.dataTransfer.files?.[0];
      if (f) onReferenceFile(f);
    },
    [onReferenceFile, stopDrag]
  );

  return (
    <footer
      ref={bottomBarRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(131,56,235,0.2)] bg-[#0f0f17] px-5 pt-3 backdrop-blur-[12px]",
        "pb-[max(12px,env(safe-area-inset-bottom))]"
      )}
    >
      <div className="mx-auto flex max-w-[1920px] flex-col gap-3 font-body">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={onFileChange}
        />

        {/* ROW 1 — Upload + Prompt */}
        <div className="flex gap-3">
          <div
            className="relative shrink-0"
            onDragEnter={stopDrag}
            onDragOver={stopDrag}
            onDrop={onDrop}
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative flex size-11 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[rgba(131,56,235,0.4)] bg-[#1a1a2e] transition-colors hover:border-[rgba(131,56,235,0.55)]"
              aria-label={referencePreviewUrl ? "Change reference image" : "Upload reference image"}
            >
              {referencePreviewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={referencePreviewUrl} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <Upload className="size-5 text-[#6b7280]" strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe your image..."
            rows={1}
            className={cn(
              "min-h-[44px] w-full min-w-0 flex-1 resize-none rounded-[10px] border border-[rgba(131,56,235,0.3)] bg-[#1a1a2e] px-[14px] py-[10px] text-sm leading-snug text-white outline-none transition-[border-color,box-shadow] placeholder:text-zorixa-muted",
              "focus:border-[#8338eb] focus:ring-2 focus:ring-[#8338eb]/35"
            )}
          />
        </div>

        {/* Negative prompt — collapsed by default; max-height 0 → 120px */}
        <div
          className={cn(
            "overflow-hidden transition-[max-height] duration-300 ease-in-out",
            showNegative ? "max-h-[120px]" : "max-h-0"
          )}
          aria-hidden={!showNegative}
        >
          <textarea
            value={negativePrompt}
            onChange={(e) => onNegativePromptChange(e.target.value)}
            placeholder="Things to avoid…"
            rows={3}
            tabIndex={showNegative ? 0 : -1}
            className={cn(
              "mb-1 box-border max-h-[120px] min-h-0 w-full resize-none rounded-[10px] border border-[rgba(131,56,235,0.3)] bg-[#1a1a2e] px-3 py-2 text-sm text-white outline-none placeholder:text-zorixa-muted",
              "focus:border-[#8338eb] focus:ring-2 focus:ring-[#8338eb]/35",
              !showNegative && "pointer-events-none"
            )}
          />
        </div>

        {/* Image batch grid — above controls row; hidden for single-image models (e.g. Grok) */}
        {showImageCountGrid ? (
          <div className="flex h-9 min-h-[36px] max-w-full flex-wrap items-center gap-3">
            <span className="shrink-0 text-xs text-[#6b7280]">Images:</span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {Array.from({ length: maxImages }, (_, i) => i + 1).map((slot) => {
                const active = slot <= batchCount;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      if (batchCount === slot) setBatchCount(1);
                      else setBatchCount(slot);
                    }}
                    className={cn(
                      "size-7 shrink-0 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                      active
                        ? "border-[#9b5cf6] bg-[#8338eb]"
                        : "border-[rgba(131,56,235,0.2)] bg-[#1a1a2e] hover:border-[rgba(131,56,235,0.35)]"
                    )}
                    aria-label={`Select ${slot} image${slot > 1 ? "s" : ""}`}
                    aria-pressed={active}
                  />
                );
              })}
            </div>
            <span className="shrink-0 text-xs tabular-nums text-[#9b7dff]">
              {batchCount} image{batchCount !== 1 ? "s" : ""} selected
            </span>
          </div>
        ) : null}

        {/* ROW 2 — Controls */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <button
            type="button"
            onClick={onToggleNegative}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[rgba(131,56,235,0.35)] bg-[#1a1a2e] px-3 text-xs font-medium text-white/90 transition-colors hover:border-[rgba(131,56,235,0.5)] hover:bg-[#1f1f35]"
            )}
          >
            Negative prompt
            {showNegative ? (
              <ChevronUp className="size-3.5 text-zorixa-muted" aria-hidden />
            ) : (
              <ChevronDown className="size-3.5 text-zorixa-muted" aria-hidden />
            )}
          </button>

          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

          {/* CAMERA dropup */}
          <div className="relative flex items-center gap-1.5">
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted sm:inline">
              Camera
            </span>
            <button
              type="button"
              onClick={() => openOnly("camera")}
              className={cn(
                triggerClass,
                "max-w-[min(200px,36vw)]",
                open === "camera" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
              )}
            >
              <span className="truncate">{cameraStyle}</span>
              <ChevronUp
                className={cn(
                  "size-3.5 shrink-0 text-zorixa-muted transition-transform",
                  open === "camera" && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {open === "camera" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{ transformOrigin: "bottom left" }}
                  className={cn(dropupPanelClass, "left-0 min-w-[200px] py-1")}
                >
                  {CAMERA_STYLES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onCameraStyleChange(c);
                        setOpen(null);
                      }}
                      className={cn(
                        "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors",
                        c === cameraStyle ? "bg-zorixa-tab text-white" : "text-white/95 hover:bg-[rgba(131,56,235,0.1)]"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

          {/* MODEL dropup (label + badge in trigger) */}
          <div className="relative flex items-center gap-1.5">
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted sm:inline">
              Model
            </span>
            <button
              type="button"
              onClick={() => openOnly("model")}
              className={cn(
                "inline-flex max-w-[min(300px,46vw)] shrink-0 flex-col items-stretch gap-1 rounded-lg border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] px-3 py-2 text-left text-xs font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand",
                open === "model" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium">{selectedModel.label}</span>
                  <span className="shrink-0">{selectedModel.badge}</span>
                </span>
                <ChevronUp
                  className={cn(
                    "size-3.5 shrink-0 text-zorixa-muted transition-transform",
                    open === "model" && "rotate-180"
                  )}
                />
              </span>
              {selectedModel.limitDetail ? (
                <span className="truncate text-[10px] leading-tight text-zorixa-muted">
                  {selectedModel.limitDetail}
                </span>
              ) : null}
            </button>
            <AnimatePresence>
              {open === "model" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{ transformOrigin: "bottom left" }}
                  className={cn(dropupPanelClass, "left-0 min-w-[min(100vw-40px,360px)] max-w-[min(100vw-40px,360px)] p-1")}
                >
                  {MODEL_OPTIONS.map((m) => (
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

          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

          {/* RESOLUTION dropup */}
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
                  style={{ transformOrigin: "bottom center" }}
                  className={cn(dropupPanelClass, "left-1/2 min-w-[100px] -translate-x-1/2 py-1")}
                >
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        onResolutionChange(r);
                        setOpen(null);
                      }}
                      className={cn(
                        "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors",
                        r === resolution ? "bg-zorixa-tab text-white" : "text-white/95 hover:bg-[rgba(131,56,235,0.1)]"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* ASPECT dropup */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openOnly("aspect")}
              className={cn(
                triggerClass,
                open === "aspect" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
              )}
            >
              <span className="max-w-[100px] truncate">{aspect}</span>
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
                  style={{ transformOrigin: "bottom center" }}
                  className={cn(dropupPanelClass, "left-1/2 min-w-[120px] -translate-x-1/2 py-1")}
                >
                  {ASPECTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        onAspectChange(a);
                        setOpen(null);
                      }}
                      className={cn(
                        "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors",
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

          <div className="hidden h-6 w-px bg-white/10 md:block" aria-hidden />

          <Toggle
            id="image-bottom-web-search"
            label="Web search"
            checked={webSearch}
            onCheckedChange={onWebSearchChange}
            className="gap-2 [&_label]:text-[11px] [&_label]:text-zorixa-muted"
          />

          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-3">
            <span className="truncate text-xs tabular-nums text-zorixa-muted">{creditsLabel}</span>
            <motion.button
              type="button"
              disabled={loading}
              onClick={onGenerate}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={cn(
                "inline-flex min-w-[140px] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8338eb] to-[#6b21a8] px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(131,56,235,0.25)] transition-shadow",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338eb]/60",
                "disabled:cursor-not-allowed disabled:opacity-60",
                !loading && "hover:shadow-[0_0_28px_rgba(131,56,235,0.4)]"
              )}
            >
              {loading ? (
                <span className="inline-flex size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Sparkles className="size-5 shrink-0" strokeWidth={2} />
              )}
              <span className="flex items-center gap-1">
                <span>GENERATE</span>
                <span className="tabular-nums opacity-95">({batchCount})</span>
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
