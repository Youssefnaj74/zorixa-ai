"use client";

import { Download, Expand, History, Play, RotateCcw } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
  type VideoHTMLAttributes
} from "react";

import { Button } from "@/components/ui/button";
import { downloadVideoFile } from "@/lib/download-video-file";
import {
  buildVideoDownloadUrl,
  extractCanonicalVideoUrlFromProxy
} from "@/lib/video-playback-proxy";
import { cn } from "@/lib/utils";

import type { ActionTab } from "@/components/video/ActionTabsRow";
import { SeedanceReferenceToVideoTip } from "@/components/video/SeedanceReferenceToVideoTip";
import { CharacterSwapModelTip } from "@/components/video/CharacterSwapModelTip";
import { VideoToVideoModelTip } from "@/components/video/VideoToVideoModelTip";

const NAV_H = 56;

/** Centered note under the preview card (Video to Video, Reference, Character Swap). */
function PreviewModelTipBelow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full shrink-0 justify-center px-1 sm:px-2">
      <div className="w-full max-w-3xl">{children}</div>
    </div>
  );
}

/** Tailwind frame for preview — driven by UI aspect, not file metadata. */
function uiAspectFrameClass(aspect: string): string {
  switch (aspect) {
    case "16:9":
      return "aspect-video";
    case "1:1":
      return "aspect-square";
    case "4:3":
      return "aspect-[4/3]";
    case "9:16":
    default:
      return "aspect-[9/16]";
  }
}

/** React 18 `@types/react` omits `referrerPolicy` on `<video>`; DOM supports it (helps some CDNs). */
const domVideoAttrs = {
  referrerPolicy: "no-referrer"
} as unknown as VideoHTMLAttributes<HTMLVideoElement>;

export function VideoPreview({
  actionTab,
  videoUrl,
  videoDownloadUrl,
  loading,
  errorMessage,
  promptThumbUrl,
  bottomBarHeight = 130,
  /** Bottom-bar aspect (9:16, 16:9, …) — frames preview until file metadata loads. */
  aspectRatio = "9:16",
  composerModelId = "seedance-2",
  className
}: {
  actionTab: ActionTab;
  /** Bottom-bar model — drives Video to Video tip highlighting. */
  composerModelId?: string;
  videoUrl: string | null;
  /** Raw Atlas/CDN https URL — used for full-file download (not the playback proxy). */
  videoDownloadUrl?: string | null;
  loading: boolean;
  errorMessage?: string | null;
  /** Small reference thumbnail (e.g. @PRODUCT_IMAGE1) shown top-center */
  promptThumbUrl?: string | null;
  /** Measured fixed bottom bar height — drives preview card max-height. */
  bottomBarHeight?: number;
  aspectRatio?: string;
  className?: string;
}) {
  const cardMaxHeight = `calc(100vh - ${NAV_H}px - ${bottomBarHeight}px)`;
  const [inlinePlaybackError, setInlinePlaybackError] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [fileAspectCss, setFileAspectCss] = useState<string | null>(null);
  const frameAspectClass = uiAspectFrameClass(aspectRatio);
  const uiPortrait = aspectRatio === "9:16";
  const canonicalDownloadUrl =
    videoDownloadUrl?.trim() ||
    (videoUrl ? extractCanonicalVideoUrlFromProxy(videoUrl) : null) ||
    (videoUrl?.startsWith("https://") ? videoUrl : null);

  const onDownloadClick = useCallback(async () => {
    if (!canonicalDownloadUrl || downloadBusy) return;
    setDownloadError(null);
    setDownloadBusy(true);
    try {
      await downloadVideoFile(canonicalDownloadUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Download failed";
      setDownloadError(msg);
      console.error("[VideoPreview] download failed", e);
    } finally {
      setDownloadBusy(false);
    }
  }, [canonicalDownloadUrl, downloadBusy]);

  useEffect(() => {
    setInlinePlaybackError(null);
    setDownloadError(null);
    setFileAspectCss(null);
  }, [videoUrl]);

  useEffect(() => {
    if (videoUrl && !errorMessage) {
      console.log("[VideoPreview] <video> will use src", {
        videoUrl,
        length: videoUrl.length,
        isEmptyString: videoUrl === "",
        looksLikeMp4Path: /\.mp4(\?|#|$)/i.test(videoUrl)
      });
    }
  }, [videoUrl, errorMessage]);

  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 font-body", className)}>
      <div
        className={cn(
          "zorixa-card-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-zorixa-card shadow-glow",
          (actionTab === "Video to Video" ||
            actionTab === "Reference to Video" ||
            actionTab === "Character Swap") &&
            "min-h-[min(42vh,320px)]"
        )}
        style={{ maxHeight: cardMaxHeight }}
      >
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
          <h2 className="font-display text-sm font-semibold text-white">Video Preview</h2>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10"
            >
              Upscale Video
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10"
            >
              Extend Video
            </Button>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-zorixa-muted hover:bg-white/5 hover:text-white"
              aria-label="Expand"
            >
              <Expand className="size-4" />
            </button>
            <span className="flex shrink-0 items-center gap-1 font-display text-[10px] font-semibold uppercase tracking-wider text-zorixa-muted sm:text-xs">
              <History className="size-3.5" />
              History
            </span>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col bg-zorixa-preview">
          {promptThumbUrl ? (
            <div className="flex shrink-0 justify-center pt-3">
              <div className="relative size-16 overflow-hidden rounded-lg ring-1 ring-[rgba(131,56,235,0.25)]">
                <Image src={promptThumbUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            </div>
          ) : null}

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4">
              {videoUrl && !errorMessage ? (
                <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center gap-3">
                  <div
                    className={cn(
                      "relative mx-auto max-h-[min(70vh,100%)] overflow-hidden rounded-xl shadow-[0_0_24px_rgba(131,56,235,0.2)] ring-1 ring-[rgba(131,56,235,0.15)]",
                      frameAspectClass,
                      uiPortrait ? "h-full w-auto max-w-[min(100%,56vh)]" : "w-full max-w-full"
                    )}
                  >
                    <video
                      key={videoUrl ? `zorixa-preview:${videoUrl}` : "zorixa-preview:empty"}
                      controls
                      playsInline
                      preload="auto"
                      {...domVideoAttrs}
                      className="size-full object-contain bg-black"
                      onLoadedMetadata={(e) => {
                        const el = e.currentTarget;
                        setInlinePlaybackError(null);
                        if (el.videoWidth > 0 && el.videoHeight > 0) {
                          const fileCss = `${el.videoWidth}/${el.videoHeight}`;
                          setFileAspectCss(fileCss);
                          const filePortrait = el.videoWidth < el.videoHeight;
                          if (uiPortrait !== filePortrait) {
                            console.warn("[VideoPreview] aspect mismatch", {
                              uiAspect: aspectRatio,
                              filePixels: `${el.videoWidth}x${el.videoHeight}`,
                              hint:
                                "File orientation differs from UI — preview frame follows your aspect setting."
                            });
                          }
                        }
                        console.log("[VideoPreview] <video> loadedmetadata", {
                          duration: el.duration,
                          videoWidth: el.videoWidth,
                          videoHeight: el.videoHeight,
                          uiFrame: frameAspectClass,
                          fileAspect: fileAspectCss,
                          currentSrc: el.currentSrc
                        });
                      }}
                      onError={(e) => {
                        const el = e.currentTarget;
                        console.error("[VideoPreview] <video> error", {
                          code: el.error?.code,
                          message: el.error?.message,
                          currentSrc: el.currentSrc,
                          networkState: el.networkState
                        });
                        const code = el.error?.code;
                        if (code === 4) {
                          setInlinePlaybackError(
                            "This output uses a format or codec your browser can't play inline (common with some Atlas / OSS files). Open in a new tab or download."
                          );
                        }
                      }}
                    >
                      <source src={videoUrl} type="video/mp4" />
                    </video>
                  </div>
                  {inlinePlaybackError ? (
                    <div className="max-w-md rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100/95">
                      <p>{inlinePlaybackError}</p>
                      <a
                        href={
                          canonicalDownloadUrl
                            ? buildVideoDownloadUrl(
                                canonicalDownloadUrl,
                                typeof window !== "undefined" ? window.location.origin : ""
                              )
                            : videoUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block font-medium text-amber-200 underline underline-offset-2 hover:text-white"
                      >
                        Open download via Zorixa
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="size-12 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                  <p className="text-sm text-zorixa-muted">Generating video…</p>
                </div>
              ) : errorMessage ? (
                <div className="max-w-md px-4 text-center">
                  <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-red-300/90">
                    Generation failed
                  </p>
                  <p className="whitespace-pre-wrap break-words text-left text-xs leading-relaxed text-red-400/95">
                    {errorMessage}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.06 }}
                    className="grid size-16 shrink-0 place-items-center rounded-full bg-[rgba(131,56,235,0.8)] text-white shadow-[0_0_32px_rgba(131,56,235,0.45)] ring-2 ring-white/20"
                    aria-label="Play preview"
                  >
                    <Play className="ml-1 size-7 fill-white" />
                  </motion.button>
                  <p className="text-sm text-zorixa-muted">Video preview</p>
                </div>
              )}
            </div>

            {downloadError ? (
              <p className="pointer-events-none absolute bottom-14 left-4 right-4 z-10 text-center text-xs text-red-400/95">
                {downloadError}
              </p>
            ) : null}

            <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="pointer-events-auto h-9 rounded-lg border border-white/15 bg-black/40 px-3 text-xs text-white backdrop-blur hover:bg-black/60"
              >
                <RotateCcw className="mr-1 size-3.5" />
                Reset to Defaults
              </Button>
              {videoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!canonicalDownloadUrl || downloadBusy}
                  onClick={() => void onDownloadClick()}
                  className="pointer-events-auto h-9 rounded-lg border border-brand/50 bg-black/30 px-3 text-xs font-medium text-white hover:bg-brand/20 disabled:opacity-60"
                >
                  <Download className="mr-1 size-3.5" />
                  {downloadBusy ? "Downloading…" : "Download"}
                </Button>
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
          </div>
        </div>
      </div>

      {actionTab === "Reference to Video" ? (
        <PreviewModelTipBelow>
          <SeedanceReferenceToVideoTip composerModelId={composerModelId} className="w-full" />
        </PreviewModelTipBelow>
      ) : null}
      {actionTab === "Video to Video" ? (
        <PreviewModelTipBelow>
          <VideoToVideoModelTip composerModelId={composerModelId} className="w-full" />
        </PreviewModelTipBelow>
      ) : null}
      {actionTab === "Character Swap" ? (
        <PreviewModelTipBelow>
          <CharacterSwapModelTip composerModelId={composerModelId} className="w-full" />
        </PreviewModelTipBelow>
      ) : null}
    </div>
  );
}
