"use client";

import { Check, ChevronUp, Sparkles, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ImageActionTab } from "@/components/image/ImageActionTabsRow";
import {
  GPT_IMAGE_2_SIZE_GROUPS,
  IMAGE_ASPECTS,
  IMAGE_CAMERA_STYLES,
  IMAGE_RESOLUTIONS
} from "@/components/image/image-bottom-bar-constants";
import { MODEL_OPTIONS, type ModelOption } from "@/components/ui/ModelDropdown";
import { getAtlasImageModelLimits } from "@/lib/atlas-image-model-ids";
import { cn } from "@/lib/utils";

export type ImageGenerateContext = {
  promptText: string;
  actionTab: ImageActionTab;
  aspectRatio: string;
  resolution: string;
  referenceUrls: string[];
  batchCount: number;
};

export type ImageBottomBarProps = {
  prompt: string;
  onPromptChange: (v: string) => void;
  actionTab: ImageActionTab;
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
  creditsLine: string;
  loadingGenerate: boolean;
  onGenerate: (ctx: ImageGenerateContext) => void | Promise<void>;
  onHeightChange?: (height: number) => void;
};

type OpenPanel = "camera" | "model" | "resolution" | "aspect" | "gptSize" | null;

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
  creditsLine,
  loadingGenerate,
  onGenerate,
  onHeightChange
}: ImageBottomBarProps) {
  const [open, setOpen] = useState<OpenPanel>(null);
  const bottomBarRef = useRef<HTMLElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const promptMirrorRef = useRef(prompt);
  promptMirrorRef.current = prompt;
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);

  const selectedModel = MODEL_OPTIONS.find((m) => m.id === modelId) ?? MODEL_OPTIONS[0];
  const maxRefs = getAtlasImageModelLimits(modelId).maxImages;
  const defaultBatch = getAtlasImageModelLimits(modelId).defaultBatch;
  const showUploads = actionTab === "Image to Image";
  const isGptImage2 = modelId === "gpt-image-2";

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
    (index: 0 | 1, url: string | null) => {
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
    (index: 0 | 1, file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      setRefAt(index, url);
    },
    [setRefAt]
  );

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
      batchCount: defaultBatch
    });
  }, [
    actionTab,
    aspect,
    defaultBatch,
    onGenerate,
    referenceUrls,
    resolution
  ]);

  const ref0 = referenceUrls[0] ?? null;
  const ref1 = referenceUrls[1] ?? null;

  return (
    <footer
      ref={bottomBarRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 h-auto border-t border-[rgba(131,56,235,0.15)] bg-[#0d0d14]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[12px]",
        "px-5 py-3 font-body"
      )}
    >
      <div className="mx-auto flex max-w-[1920px] flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
          {showUploads ? (
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start">
              <input
                ref={fileRef1}
                type="file"
                accept="image/*"
                className="hidden"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) applyFile(0, f);
                  e.target.value = "";
                }}
              />
              <input
                ref={fileRef2}
                type="file"
                accept="image/*"
                className="hidden"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) applyFile(1, f);
                  e.target.value = "";
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { idx: 0 as const, label: "Reference", url: ref0, ref: fileRef1 },
                    { idx: 1 as const, label: "Style", url: ref1, ref: fileRef2 }
                  ] as const
                ).map(({ idx, label, url, ref }) => (
                  <div
                    key={label}
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
                      onClick={() => ref.current?.click()}
                      className={cn(
                        "relative flex h-[88px] w-[150px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl",
                        "border border-dashed border-white/20 bg-black/40 text-zorixa-muted transition-colors",
                        "hover:border-white/30 hover:bg-black/55"
                      )}
                    >
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
                      ) : (
                        <>
                          <Upload className="size-5 opacity-60" />
                          <span className="mt-2 text-xs font-medium text-zorixa-muted">{label}</span>
                        </>
                      )}
                    </button>
                    {url ? (
                      <button
                        type="button"
                        onClick={() => setRefAt(idx, null)}
                        className="absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80 hover:bg-black hover:text-white"
                        aria-label={`Remove ${label}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                ))}
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
              placeholder="Describe your image..."
              style={{ resize: "none" }}
              className={cn(
                "scrollbar-hide w-full resize-none rounded-lg bg-[#0a0a0a] px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-zorixa-muted",
                "focus-visible:ring-2 focus-visible:ring-brand"
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">Model</span>
            <div className="relative">
              <button
                type="button"
                title={selectedModel.title ?? selectedModel.label}
                onClick={() => openOnly("model")}
                className={cn(triggerClass, open === "model" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]")}
              >
                <span className="max-w-[140px] truncate">{selectedModel.label}</span>
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

          {isGptImage2 ? (
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

          <span className="ml-auto text-xs tabular-nums text-zorixa-muted">{creditsLine}</span>

          <motion.button
            type="button"
            disabled={loadingGenerate}
            onClick={emitGenerate}
            whileHover={loadingGenerate ? undefined : { scale: 1.02 }}
            whileTap={loadingGenerate ? undefined : { scale: 0.98 }}
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
    </footer>
  );
}
