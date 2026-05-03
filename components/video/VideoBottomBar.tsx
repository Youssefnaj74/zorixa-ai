"use client";

import { ChevronUp, Sparkles, Upload } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

import {
  ASPECT_STEP_OPTIONS,
  BOTTOM_BAR_MODELS,
  MODE_DROPUP_OPTIONS,
  RESOLUTION_STEP_OPTIONS,
  STANDARD_DURATION_OPTIONS,
  TIME_SECONDS_OPTIONS,
  type BottomBarModel
} from "@/components/video/bottom-bar-models";

export type VideoBottomBarProps = {
  prompt: string;
  onPromptChange: (v: string) => void;
  promptImageUrl: string | null;
  onPromptImageChange: (url: string | null) => void;
  promptImage2Url?: string | null;
  onPromptImage2Change?: (url: string | null) => void;
  /** Bottom bar model (dropup). */
  composerModelId: string;
  onComposerModelChange: (id: string) => void;
  fullAccessOn: boolean;
  onFullAccessChange: (v: boolean) => void;
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
  aiAgent: boolean;
  onAiAgentChange: (v: boolean) => void;
  creditsLine: string;
  loadingGenerate: boolean;
  onGenerate: () => void;
  /** Report measured height so the page can reserve space above this fixed bar. */
  onHeightChange?: (height: number) => void;
};

type OpenPanel = "model" | "mode" | "standard" | "time" | "aspect" | "resolution" | null;

const dropupPanelClass =
  "absolute bottom-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] shadow-glow-lg";

const triggerClass =
  "inline-flex h-9 min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] px-3 text-xs font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand";

function FullAccessToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "flex min-w-[72px] items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
        on ? "bg-[#16a34a] text-white shadow-[0_0_12px_rgba(22,163,74,0.35)]" : "bg-zinc-700 text-zinc-300"
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
  promptImageUrl,
  onPromptImageChange,
  promptImage2Url = null,
  onPromptImage2Change,
  composerModelId,
  onComposerModelChange,
  fullAccessOn,
  onFullAccessChange,
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
  aiAgent,
  onAiAgentChange,
  creditsLine,
  loadingGenerate,
  onGenerate,
  onHeightChange
}: VideoBottomBarProps) {
  const [open, setOpen] = useState<OpenPanel>(null);
  const bottomBarRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const [file1Name, setFile1Name] = useState<string | null>(null);
  const [file2Name, setFile2Name] = useState<string | null>(null);

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

  const selectedModel = BOTTOM_BAR_MODELS.find((m) => m.id === composerModelId) ?? BOTTOM_BAR_MODELS[1];

  const applySlot1File = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
      const url = URL.createObjectURL(file);
      onPromptImageChange(url);
      setFile1Name(file.name);
      if (!prompt.includes("@PRODUCT_IMAGE1")) {
        onPromptChange(`Using @PRODUCT_IMAGE1 ${prompt.replace(/^Using\s*/, "")}`.trim());
      }
    },
    [onPromptChange, onPromptImageChange, prompt]
  );

  const applySlot2File = useCallback(
    (file: File) => {
      if (!onPromptImage2Change) return;
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
      const url = URL.createObjectURL(file);
      onPromptImage2Change(url);
      setFile2Name(file.name);
      if (!prompt.includes("@PRODUCT_IMAGE2")) {
        onPromptChange(`${prompt.trim()} @PRODUCT_IMAGE2`.trim());
      }
    },
    [onPromptChange, onPromptImage2Change, prompt]
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

  const productCount = (promptImageUrl ? 1 : 0) + (promptImage2Url ? 1 : 0);

  useEffect(() => {
    if (!promptImageUrl) setFile1Name(null);
  }, [promptImageUrl]);

  useEffect(() => {
    if (!promptImage2Url) setFile2Name(null);
  }, [promptImage2Url]);

  return (
    <footer
      ref={bottomBarRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 h-auto border-t border-[rgba(131,56,235,0.15)] bg-[#0d0d14]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[12px)",
        "px-5 py-3 font-body"
      )}
    >
      <div className="mx-auto flex max-w-[1920px] flex-col gap-3">
        {/* ROW 1 — Prompt */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
          <div className="flex shrink-0 flex-wrap items-center gap-3">
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
              className="relative shrink-0"
              onDragEnter={stopDragDefaults}
              onDragOver={stopDragDefaults}
              onDrop={onDropSlot1}
            >
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative flex size-12 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/25 bg-black/40 text-zorixa-muted transition-colors hover:border-white/35 hover:bg-black/55"
                aria-label={promptImageUrl ? "Change reference image or video" : "Upload reference image or video"}
              >
                {promptImageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={promptImageUrl} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <Upload className="size-5 opacity-50" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-white/15 bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
              aria-label="Upload image or video"
            >
              <Upload className="size-4" />
            </button>

            <div onDragEnter={stopDragDefaults} onDragOver={stopDragDefaults} onDrop={onDropSlot2}>
              <button
                type="button"
                onClick={() => fileRef2.current?.click()}
                className="relative grid size-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-white/20 bg-zinc-900/80 text-zinc-500 transition-colors hover:border-brand/40 hover:text-zorixa-muted"
                aria-label="Secondary upload — image or video"
              >
                {promptImage2Url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={promptImage2Url} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <Upload className="size-3.5 opacity-60" />
                )}
              </button>
            </div>

            <span className="rounded-full bg-brand/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-light ring-1 ring-brand/30">
              Influencers
            </span>
            <span className="max-w-[140px] truncate text-xs tabular-nums text-zorixa-muted" title={[file1Name, file2Name].filter(Boolean).join(", ") || undefined}>
              {productCount === 0
                ? "No files"
                : productCount === 1
                  ? file1Name || file2Name || "1 Product"
                  : `${productCount} Products`}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={2}
              placeholder="Type @ to reference relevant…"
              className={cn(
                "w-full resize-y rounded-lg bg-[#0a0a0a] px-3 py-2.5 text-sm leading-relaxed text-white outline-none transition-shadow placeholder:text-zorixa-muted",
                "focus-visible:ring-2 focus-visible:ring-brand"
              )}
            />
          </div>
          <div className="hidden min-w-[24px] shrink-0 lg:block" aria-hidden />
        </div>

        {/* ROW 2 — Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* MODEL */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">Model</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => openOnly("model")}
                className={cn(
                  triggerClass,
                  open === "model" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
                )}
              >
                <span className="max-w-[140px] truncate">{selectedModel.label}</span>
                <ChevronUp
                  className={cn(
                    "size-3.5 shrink-0 text-zorixa-muted transition-transform",
                    open === "model" && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {open === "model" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{ transformOrigin: "bottom left" }}
                    className={cn(dropupPanelClass, "left-0 min-w-[220px] py-1")}
                  >
                    {BOTTOM_BAR_MODELS.map((m) => (
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
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">Full access</span>
            <FullAccessToggle on={fullAccessOn} onChange={onFullAccessChange} />
          </div>

          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

          {/* MODE */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">Mode</span>
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

          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

          {/* Standard */}
          <div className="relative">
            <button
              type="button"
              onClick={() => openOnly("standard")}
              className={cn(
                triggerClass,
                open === "standard" && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
              )}
            >
              <span>{durationStandard}</span>
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
                      {d}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

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
                  {TIME_SECONDS_OPTIONS.map((t) => (
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

          {/* Aspect */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">Aspect</span>
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
                    {ASPECT_STEP_OPTIONS.map((a) => (
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

          {/* Resolution */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">Resolution</span>
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
                    {RESOLUTION_STEP_OPTIONS.map((r) => (
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

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase text-zorixa-muted">AI Agent</span>
            <Toggle id="bar-ai-agent" checked={aiAgent} onCheckedChange={onAiAgentChange} />
          </div>

          <span className="ml-auto text-xs tabular-nums text-zorixa-muted">{creditsLine}</span>

          <motion.button
            type="button"
            disabled={loadingGenerate}
            whileHover={loadingGenerate ? undefined : { scale: 1.02 }}
            whileTap={loadingGenerate ? undefined : { scale: 0.98 }}
            onClick={onGenerate}
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
        "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors",
        disabled && "cursor-not-allowed opacity-40",
        !disabled && active && "bg-zorixa-tab text-white",
        !disabled && !active && "text-white/95 hover:bg-[rgba(131,56,235,0.1)]",
        disabled && "hover:bg-transparent"
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{model.label}</span>
        {model.locked ? <span aria-hidden>🔒</span> : null}
        {model.badge === "newTeal" ? <Badge variant="newTeal">NEW</Badge> : null}
        {model.badge === "pro" ? <Badge variant="pro">PRO</Badge> : null}
      </span>
    </button>
  );
}
