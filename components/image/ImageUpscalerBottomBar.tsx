"use client";

import { ChevronUp, RotateCcw, Sparkles, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { ImageActionTabsRow, type ImageActionTab } from "@/components/image/ImageActionTabsRow";
import {
  ATLAS_IMAGE_UPSCALER_OUTSCALE_OPTIONS,
  type AtlasImageUpscalerOutscale
} from "@/lib/atlas-image-upscaler";
import { COMPOSER_DOCK_WITH_TABS_HEIGHT } from "@/lib/composer-dock-height";
import { studioReferenceImageAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

export type ImageUpscalerBottomBarProps = {
  actionTab: ImageActionTab;
  onActionTabChange: (tab: ImageActionTab) => void;
  inputUrl: string | null;
  onInputChange: (previewUrl: string | null, file?: File | null) => void;
  outscale: AtlasImageUpscalerOutscale;
  onOutscaleChange: (value: AtlasImageUpscalerOutscale) => void;
  creditsLine: string;
  loading: boolean;
  onUpscale: () => void | Promise<void>;
  onReset: () => void;
  onHeightChange?: (height: number) => void;
};

const dropupPanelClass =
  "absolute bottom-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-[rgba(131,56,235,0.2)] bg-zorixa-dropdown shadow-glow-lg ring-1 ring-white/5";

const triggerClass =
  "inline-flex h-9 min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-[rgba(131,56,235,0.2)] bg-[#1a1a24] px-3 text-xs font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand";

export function ImageUpscalerBottomBar({
  actionTab,
  onActionTabChange,
  inputUrl,
  onInputChange,
  outscale,
  onOutscaleChange,
  creditsLine,
  loading,
  onUpscale,
  onReset,
  onHeightChange
}: ImageUpscalerBottomBarProps) {
  const bottomBarRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [openOutscale, setOpenOutscale] = useState(false);

  useEffect(() => {
    if (!onHeightChange) return;
    const el = bottomBarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onHeightChange(el.offsetHeight));
    ro.observe(el);
    onHeightChange(el.offsetHeight);
    return () => ro.disconnect();
  }, [onHeightChange]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!bottomBarRef.current?.contains(e.target as Node)) setOpenOutscale(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const applyFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      onInputChange(URL.createObjectURL(file), file);
    },
    [onInputChange]
  );

  const clearInput = useCallback(() => {
    onInputChange(null, null);
    if (fileRef.current) fileRef.current.value = "";
  }, [onInputChange]);

  const stopDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <footer
      ref={bottomBarRef}
      style={{ minHeight: COMPOSER_DOCK_WITH_TABS_HEIGHT }}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-[rgba(131,56,235,0.15)] bg-[#0d0d14]/95 px-5 py-3 pb-[env(safe-area-inset-bottom)] font-body backdrop-blur-[12px] max-lg:max-h-[min(58dvh,480px)] max-lg:overflow-hidden max-lg:px-3 max-lg:py-2.5"
    >
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-3 max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-y-contain">
        <div className="shrink-0">
          <ImageActionTabsRow
            active={actionTab}
            onChange={onActionTabChange}
            className="h-11 min-h-[44px] w-full"
          />
        </div>

        <div className="flex min-h-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) applyFile(f);
              e.target.value = "";
            }}
          />
          <div
            className="relative shrink-0"
            onDragEnter={stopDrag}
            onDragOver={stopDrag}
            onDrop={(e) => {
              stopDrag(e);
              const f = e.dataTransfer.files?.[0];
              if (f) applyFile(f);
            }}
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative flex h-[88px] w-[150px] max-lg:h-[72px] max-lg:w-[min(44vw,132px)] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl",
                "border border-dashed border-white/20 bg-black/40 text-zorixa-muted transition-colors",
                "hover:border-white/30 hover:bg-black/55"
              )}
            >
              {inputUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inputUrl}
                  alt={studioReferenceImageAlt("image")}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <>
                  <Upload className="size-5 opacity-60" />
                  <span className="mt-2 text-xs font-medium text-zorixa-muted">Add image</span>
                  <span className="mt-0.5 text-[10px] text-zorixa-muted/70">1 / 1</span>
                </>
              )}
            </button>
            {inputUrl ? (
              <button
                type="button"
                onClick={clearInput}
                className="absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-white/10 bg-black/70 text-white/80 hover:bg-black hover:text-white"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 rounded-lg bg-[#0a0a0a] px-3 py-2.5 text-sm leading-relaxed text-zorixa-muted">
            Increase resolution up to 4× with texture-aware enhancement. Upload one image, pick
            outscale, then run Upscale.
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-white/5 pt-2 max-lg:flex-col max-lg:items-stretch max-lg:gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted">
              Outscale
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenOutscale((o) => !o)}
                className={cn(
                  triggerClass,
                  openOutscale && "border-[rgba(131,56,235,0.5)] bg-[rgba(131,56,235,0.1)]"
                )}
              >
                <span>{outscale}×</span>
                <ChevronUp
                  className={cn("size-3.5 text-zorixa-muted", openOutscale && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {openOutscale ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ transformOrigin: "bottom left" }}
                    className={cn(dropupPanelClass, "left-0 min-w-[100px] py-1")}
                  >
                    {ATLAS_IMAGE_UPSCALER_OUTSCALE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          onOutscaleChange(opt);
                          setOpenOutscale(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm",
                          opt === outscale
                            ? "bg-zorixa-selected text-white"
                            : "text-white/95 hover:bg-white/5"
                        )}
                      >
                        {opt}×
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a24] px-3 text-xs font-medium text-zorixa-muted transition-colors hover:text-white"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>

          <div className="ml-auto flex items-center gap-3 max-lg:ml-0 max-lg:w-full max-lg:justify-between max-lg:border-t max-lg:border-white/10 max-lg:pt-2">
            <span className="text-sm font-semibold tabular-nums text-white/90">{creditsLine}</span>
            <motion.button
              type="button"
              disabled={loading || !inputUrl}
              whileTap={loading ? undefined : { scale: 0.98 }}
              onClick={() => void onUpscale()}
              className="inline-flex min-w-[140px] shrink-0 items-center justify-center gap-2 rounded-xl bg-zorixa-tab px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:bg-[#1d4ed8] disabled:opacity-60 max-lg:min-h-[44px] max-lg:flex-1 max-lg:min-w-0"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Upscale
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
