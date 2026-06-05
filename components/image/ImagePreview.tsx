"use client";

import { useCallback, useState } from "react";
import { Download, Expand, History, ImageIcon, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExternalImage } from "@/components/ui/ExternalImage";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { cn } from "@/lib/utils";

const NAV_H = 56;

function BatchPreviewTile({
  url,
  label,
  onZoom
}: {
  url: string;
  label: string;
  onZoom: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-black/25 ring-1 ring-[rgba(131,56,235,0.2)]">
      <button
        type="button"
        onClick={onZoom}
        className="group relative flex min-h-[140px] flex-1 cursor-zoom-in items-center justify-center p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label={`Zoom ${label}`}
      >
        <ExternalImage
          src={url}
          alt={label}
          width={768}
          height={1024}
          className="max-h-[min(42vh,360px)] w-full object-contain transition-transform group-hover:scale-[1.02]"
        />
      </button>
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-black/50 px-2.5 py-2">
        <span className="text-[11px] font-medium tabular-nums text-white/55">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onZoom}
            className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label={`Expand ${label}`}
          >
            <Expand className="size-3.5" />
          </button>
          <a
            href={url}
            download
            target="_blank"
            rel="noreferrer"
            className="grid size-8 place-items-center rounded-lg border border-brand/40 bg-brand/10 text-white hover:bg-brand/20"
            aria-label={`Download ${label}`}
          >
            <Download className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function ImagePreview({
  imageUrls = [],
  loading,
  errorMessage,
  referenceThumbUrls,
  referenceThumbUrl,
  isExample = false,
  bottomBarHeight = 130,
  className
}: {
  /** One or more generated image URLs (batch shows a grid). */
  imageUrls?: string[];
  loading?: boolean;
  errorMessage?: string | null;
  /** Reference / style uploads shown in Image to Image mode. */
  referenceThumbUrls?: string[];
  /** @deprecated Use referenceThumbUrls */
  referenceThumbUrl?: string | null;
  /** Studio demo output (not a user generation). */
  isExample?: boolean;
  bottomBarHeight?: number;
  className?: string;
}) {
  const urls = imageUrls.filter((u) => typeof u === "string" && u.trim().length > 0);
  const primaryUrl = urls[0] ?? null;
  const isBatch = urls.length > 1;
  const refUrls = (
    referenceThumbUrls?.length
      ? referenceThumbUrls
      : referenceThumbUrl
        ? [referenceThumbUrl]
        : []
  ).filter((u) => typeof u === "string" && u.trim().length > 0);
  const refLabels = ["Reference", "Style"] as const;

  const cardMaxHeight = `calc(100vh - ${NAV_H}px - ${bottomBarHeight}px)`;
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState("Image preview");

  const openLightbox = useCallback((url: string, title: string) => {
    setLightboxSrc(url);
    setLightboxTitle(title);
  }, []);

  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 font-body", className)}>
      <div
        className="zorixa-card-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-zorixa-card shadow-glow"
        style={{ maxHeight: cardMaxHeight }}
      >
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
          <h2 className="font-display text-sm font-semibold text-white">
            Image Preview
            {isExample ? (
              <span className="ml-2 rounded-md bg-brand/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-light">
                Example
              </span>
            ) : null}
            {isBatch ? (
              <span className="ml-2 text-xs font-normal tabular-nums text-zorixa-muted">
                ({urls.length} images)
              </span>
            ) : null}
          </h2>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10"
            >
              Upscale Image
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10"
            >
              Variations
            </Button>
            {!isBatch ? (
              <button
                type="button"
                disabled={!primaryUrl || loading}
                onClick={() => primaryUrl && openLightbox(primaryUrl, "Image preview")}
                className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-zorixa-muted hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Expand preview"
              >
                <Expand className="size-4" />
              </button>
            ) : null}
            <span className="flex shrink-0 items-center gap-1 font-display text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted sm:text-xs">
              <History className="size-3.5" />
              History
            </span>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col bg-zorixa-preview">
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col",
                isBatch ? "overflow-y-auto p-3" : "items-center justify-center p-4"
              )}
            >
              {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                  <div className="size-12 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                  <p className="text-sm text-zorixa-muted">Generating image…</p>
                </div>
              ) : errorMessage ? (
                <p className="m-auto max-w-md text-center text-sm text-red-400">{errorMessage}</p>
              ) : isBatch ? (
                <div
                  className={cn(
                    "grid w-full gap-3",
                    urls.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
                  )}
                >
                  {urls.map((url, i) => (
                    <BatchPreviewTile
                      key={`${url}-${i}`}
                      url={url}
                      label={`${i + 1} / ${urls.length}`}
                      onZoom={() => openLightbox(url, `Image ${i + 1} of ${urls.length}`)}
                    />
                  ))}
                </div>
              ) : primaryUrl ? (
                <button
                  type="button"
                  onClick={() => openLightbox(primaryUrl, "Image preview")}
                  className="group relative max-h-full max-w-full cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label="Enlarge image preview"
                >
                  <ExternalImage
                    src={primaryUrl}
                    alt="Generated output"
                    width={1024}
                    height={1024}
                    className="max-h-full max-w-full rounded-xl object-contain shadow-[0_0_24px_rgba(131,56,235,0.2)] ring-1 ring-[rgba(131,56,235,0.15)] transition-transform group-hover:scale-[1.01]"
                  />
                </button>
              ) : refUrls.length > 0 ? (
                <div
                  className={cn(
                    "grid w-full max-w-lg gap-3",
                    refUrls.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                  )}
                >
                  {refUrls.map((refUrl, i) => (
                    <div
                      key={`${refUrl}-${i}`}
                      className="flex min-h-[140px] flex-col overflow-hidden rounded-xl bg-black/25 ring-1 ring-[rgba(131,56,235,0.2)]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openLightbox(refUrl, refLabels[i] ?? `Reference ${i + 1}`)
                        }
                        className="group relative flex flex-1 cursor-zoom-in items-center justify-center p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        aria-label={`Zoom ${refLabels[i] ?? `reference ${i + 1}`}`}
                      >
                        <ExternalImage
                          src={refUrl}
                          alt={refLabels[i] ?? `Reference ${i + 1}`}
                          width={512}
                          height={512}
                          className="max-h-[min(38vh,320px)] w-full object-contain transition-transform group-hover:scale-[1.02]"
                        />
                      </button>
                      <div className="border-t border-white/10 bg-black/50 px-3 py-2 text-center text-[11px] font-medium text-white/55">
                        {refLabels[i] ?? `Reference ${i + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="m-auto flex flex-col items-center justify-center gap-4">
                  <div className="grid size-16 place-items-center rounded-full bg-[rgba(131,56,235,0.25)] text-brand-light ring-2 ring-white/10">
                    <ImageIcon className="size-8" />
                  </div>
                  <p className="text-sm text-zorixa-muted">Image preview</p>
                </div>
              )}
            </div>

            {!isBatch ? (
              <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="pointer-events-auto h-9 rounded-lg border border-white/15 bg-black/40 px-3 text-xs text-white backdrop-blur hover:bg-black/60"
                >
                  <RotateCcw className="mr-1 size-3.5" />
                  Reset to Defaults
                </Button>
                {primaryUrl ? (
                  <a
                    href={primaryUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="pointer-events-auto inline-flex h-9 items-center justify-center rounded-lg border border-brand/50 bg-black/30 px-3 text-xs font-medium text-white transition-colors hover:bg-brand/20"
                  >
                    <Download className="mr-1 size-3.5" />
                    Download
                  </a>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled
                    className="pointer-events-auto h-9 cursor-not-allowed rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-zorixa-muted opacity-50"
                  >
                    <Download className="mr-1 size-3.5" />
                    Download
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ImageLightbox
        open={lightboxSrc != null}
        src={lightboxSrc}
        alt={lightboxTitle}
        title={lightboxTitle}
        onClose={closeLightbox}
      />
    </div>
  );
}
