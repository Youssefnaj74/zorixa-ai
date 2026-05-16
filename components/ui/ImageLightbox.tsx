"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";

import { ExternalImage } from "@/components/ui/ExternalImage";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
}

type Pan = { x: number; y: number };

function clampPan(
  pan: Pan,
  zoom: number,
  image: { w: number; h: number },
  viewport: { w: number; h: number }
): Pan {
  if (zoom <= 1 || image.w <= 0 || image.h <= 0) return { x: 0, y: 0 };
  const scaledW = image.w * zoom;
  const scaledH = image.h * zoom;
  const maxX = Math.max(0, (scaledW - viewport.w) / 2);
  const maxY = Math.max(0, (scaledH - viewport.h) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y))
  };
}

export function ImageLightbox({
  open,
  src,
  alt = "Preview",
  title,
  onClose
}: {
  open: boolean;
  src: string | null;
  alt?: string;
  title?: string;
  onClose: () => void;
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0
  });

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const applyPan = useCallback(
    (next: Pan) => {
      setPan(clampPan(next, zoomLevel, imageSize, viewportSize));
    },
    [zoomLevel, imageSize, viewportSize]
  );

  const zoomIn = useCallback(() => setZoomLevel((z) => clampZoom(z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoomLevel((z) => clampZoom(z - ZOOM_STEP)), []);

  useEffect(() => {
    if (!open) {
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
      setImageSize({ w: 0, h: 0 });
    }
  }, [open, src]);

  useEffect(() => {
    if (zoomLevel <= 1) setPan({ x: 0, y: 0 });
    else setPan((p) => clampPan(p, zoomLevel, imageSize, viewportSize));
  }, [zoomLevel, imageSize, viewportSize]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || !open) return;
    const measure = () => {
      setViewportSize({ w: vp.clientWidth, h: vp.clientHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomLevel > 1) {
          resetZoom();
          return;
        }
        onClose();
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, zoomLevel, onClose, resetZoom, zoomIn, zoomOut]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ w: img.offsetWidth, h: img.offsetHeight });
  }, []);

  const onViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1 || e.button !== 0) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    applyPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY)
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const handleBackdropClick = () => {
    if (zoomLevel > 1) resetZoom();
    else onClose();
  };

  const zoomPercent = Math.round(zoomLevel * 100);
  const canPan = zoomLevel > 1;

  return (
    <AnimatePresence>
      {open && src ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title ?? alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative flex max-h-[92vh] w-full max-w-6xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/75"
                aria-label="Close preview"
              >
                <X className="size-5" />
              </button>

              <div
                ref={viewportRef}
                className={cn(
                  "flex max-h-[85vh] min-h-[min(70vh,560px)] w-full touch-none select-none items-center justify-center overflow-hidden bg-black/40",
                  canPan && "cursor-grab active:cursor-grabbing"
                )}
                onPointerDown={onViewportPointerDown}
                onPointerMove={onViewportPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onWheel={onWheel}
              >
                <div
                  className="inline-block origin-center transition-transform duration-150 ease-out will-change-transform"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`
                  }}
                >
                  <ExternalImage
                    src={src}
                    alt={alt}
                    onLoad={onImageLoad}
                    className="pointer-events-none block max-h-[min(78vh,720px)] w-auto max-w-[min(92vw,1100px)] object-contain select-none"
                  />
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4">
                <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/60 p-1 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={zoomOut}
                    disabled={zoomLevel <= ZOOM_MIN}
                    className="grid size-9 place-items-center rounded-full text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Zoom out"
                  >
                    <Minus className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="min-w-[3.25rem] rounded-full px-2 py-1.5 text-center text-xs font-semibold tabular-nums text-white hover:bg-white/10"
                    aria-label="Reset zoom"
                  >
                    {zoomPercent}%
                  </button>
                  <button
                    type="button"
                    onClick={zoomIn}
                    disabled={zoomLevel >= ZOOM_MAX}
                    className="grid size-9 place-items-center rounded-full text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Zoom in"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
              </div>
            </motion.div>

            {title ? (
              <p className="mt-3 truncate px-1 text-center text-sm text-white/70">{title}</p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
