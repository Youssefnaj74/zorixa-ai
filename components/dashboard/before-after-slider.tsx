"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { ExternalImage } from "@/components/ui/ExternalImage";
import { imageUpscalerCompareAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeAlt,
  afterAlt,
  className,
  /** Fits inside Image Studio preview card (does not use viewport-tall portrait sizing). */
  fit = "default",
  studioMaxHeight,
  studioMaxWidth
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeAlt?: string;
  afterAlt?: string;
  className?: string;
  fit?: "default" | "studio";
  studioMaxHeight?: string;
  studioMaxWidth?: string;
}) {
  const [value, setValue] = useState(50);
  const trackRef = useRef<HTMLDivElement>(null);
  /** Reveal before on the left; after stays full underneath on the right. */
  const beforeClip = useMemo(() => `inset(0 ${100 - value}% 0 0)`, [value]);

  const updateFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setValue(Math.min(100, Math.max(0, pct)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      updateFromClientX(e.clientX);

      const onMove = (ev: PointerEvent) => updateFromClientX(ev.clientX);
      const onUp = () => {
        target.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [updateFromClientX]
  );

  const isStudio = fit === "studio";
  const afterImageStyle =
    isStudio && (studioMaxHeight || studioMaxWidth)
      ? {
          ...(studioMaxHeight ? { maxHeight: studioMaxHeight } : {}),
          ...(studioMaxWidth ? { maxWidth: studioMaxWidth } : {})
        }
      : undefined;

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative mx-auto select-none overflow-hidden rounded-2xl border border-white/10",
        isStudio ? "max-h-full w-auto max-w-full" : "w-fit max-w-full",
        className
      )}
      onPointerDown={onPointerDown}
    >
      <ExternalImage
        src={afterUrl}
        alt={afterAlt ?? imageUpscalerCompareAlt("after")}
        style={afterImageStyle}
        className={
          isStudio
            ? "block h-auto w-auto object-contain"
            : "block h-auto max-h-[min(56vh,600px)] w-auto max-w-[min(calc(100vw-4rem),480px)]"
        }
      />
      <ExternalImage
        src={beforeUrl}
        alt={beforeAlt ?? imageUpscalerCompareAlt("before")}
        className={cn(
          "absolute inset-0 h-full w-full",
          isStudio ? "object-contain object-center" : "object-contain object-top"
        )}
        style={{ clipPath: beforeClip }}
      />

      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/80 shadow-[0_0_12px_rgba(0,0,0,0.45)]"
        style={{ left: `${value}%` }}
      />

      <button
        type="button"
        aria-label="Drag to compare before and after"
        className="absolute top-1/2 z-20 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/95 text-zinc-800 shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ left: `${value}%` }}
        onPointerDown={onPointerDown}
      >
        <span className="flex items-center gap-0">
          <ChevronLeft className="size-3.5" aria-hidden />
          <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-xs font-medium text-white/90">
        <span>Before</span>
        <span>After</span>
      </div>
    </div>
  );
}
