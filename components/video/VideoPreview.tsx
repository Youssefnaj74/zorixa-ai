"use client";

import Link from "next/link";
import { Download, Expand, History, Play, RotateCcw } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type VideoHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { downloadVideoFile, videoDownloadFilename } from "@/lib/download-video-file";
import { isInsufficientCreditsMessage } from "@/lib/insufficient-credits-message";
import { extractCanonicalVideoUrlFromProxy } from "@/lib/video-playback-proxy";
import { studioReferenceImageAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

import type { ActionTab } from "@/components/video/ActionTabsRow";
import { VideoGenerationProgress } from "@/components/video/VideoGenerationProgress";
import { DirectorResultBanner } from "@/components/video/DirectorResultBanner";
import { SeedanceReferenceToVideoTip } from "@/components/video/SeedanceReferenceToVideoTip";
import { VideoToVideoModelTip } from "@/components/video/VideoToVideoModelTip";

import { useStudioNavOffset } from "@/lib/hooks/use-studio-nav-offset";

/** Size constraints for the preview frame inside the card. */
function uiAspectFrameLayoutClass(aspect: string): string {
  switch (aspect) {
    case "9:16":
      return "h-full w-auto max-w-[min(100%,56vh)] max-lg:max-w-[min(100%,38vh)]";
    case "1:1":
      return "w-full max-w-[min(100%,min(56vh,480px))]";
    case "16:9":
    default:
      return "w-full max-w-full";
  }
}

/** Tailwind aspect ratio on the preview frame — driven by UI aspect, not file metadata. */
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
  isExample = false,
  directorResult = null,
  directorResultLoading = false,
  generationProgress = null,
  promptThumbUrl,
  bottomBarHeight = 130,
  /** Bottom-bar aspect (9:16, 16:9, …) — frames preview until file metadata loads. */
  aspectRatio = "9:16",
  composerModelId = "seedance-2",
  canPostProcessVideo = false,
  postProcessBusy = false,
  onResetDefaults,
  onExtendVideo,
  onUpscaleVideo,
  onPlaybackConfirmed,
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
  /** Model showcase demo — not a user generation. */
  isExample?: boolean;
  /** AI Director — result panel after generation. */
  directorResult?: {
    modelLabel: string;
    styleLabel: string;
    creditsSpent: number;
    canTryAnother: boolean;
    onRegenerate: () => void;
    onTryAnother: () => void;
  } | null;
  directorResultLoading?: boolean;
  /** In-progress generation UI (timer, stages, cancel). */
  generationProgress?: {
    modelLabel: string;
    composerModelId: string;
    elapsedSec: number;
    directorRouted: boolean;
    tip: string;
    showSlowBanner: boolean;
    canTryAnother: boolean;
    onCancel: () => void;
    onKeepWaiting: () => void;
    onTryAnother: () => void;
  } | null;
  /** Small reference thumbnail (e.g. @PRODUCT_IMAGE1) shown top-center */
  promptThumbUrl?: string | null;
  /** Measured fixed bottom bar height — drives preview card max-height. */
  bottomBarHeight?: number;
  aspectRatio?: string;
  canPostProcessVideo?: boolean;
  postProcessBusy?: boolean;
  onResetDefaults?: () => void;
  onExtendVideo?: () => void;
  onUpscaleVideo?: () => void;
  /** Fired once inline playback metadata loads — triggers deferred Atlas CDN mirror. */
  onPlaybackConfirmed?: () => void;
  className?: string;
}) {
  const studioNavOffset = useStudioNavOffset();
  const cardMaxHeight = `calc(100vh - ${studioNavOffset}px - ${bottomBarHeight}px)`;
  const [inlinePlaybackError, setInlinePlaybackError] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const downloadInFlightRef = useRef(false);
  const playbackConfirmedRef = useRef(false);
  const [fileAspectCss, setFileAspectCss] = useState<string | null>(null);
  const frameAspectClass = uiAspectFrameClass(aspectRatio);
  const frameLayoutClass = uiAspectFrameLayoutClass(aspectRatio);
  const uiPortrait = aspectRatio === "9:16";
  const canonicalDownloadUrl =
    videoDownloadUrl?.trim() ||
    (videoUrl ? extractCanonicalVideoUrlFromProxy(videoUrl) : null) ||
    (videoUrl?.startsWith("https://") ? videoUrl : null);

  const onDownloadClick = useCallback(async () => {
    if (!canonicalDownloadUrl || downloadInFlightRef.current) return;
    setDownloadError(null);
    downloadInFlightRef.current = true;
    setDownloadBusy(true);
    try {
      await downloadVideoFile(canonicalDownloadUrl, videoDownloadFilename(canonicalDownloadUrl));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Download failed";
      setDownloadError(msg);
      if (process.env.NODE_ENV === "development") {
        console.warn("[VideoPreview] download failed", msg);
      }
    } finally {
      downloadInFlightRef.current = false;
      setDownloadBusy(false);
    }
  }, [canonicalDownloadUrl]);

  useEffect(() => {
    setInlinePlaybackError(null);
    setDownloadError(null);
    setFileAspectCss(null);
    playbackConfirmedRef.current = false;
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

  const showInPreviewModelTip =
    !videoUrl &&
    !loading &&
    !errorMessage &&
    (actionTab === "Video to Video" || actionTab === "Reference to Video");

  const previewPlaceholderHero = (
    <div className="flex shrink-0 flex-col items-center justify-center gap-4">
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
  );

  const showPromptThumb = Boolean(promptThumbUrl && !videoUrl && !loading);

  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 font-body", className)}>
      <div
        className={cn(
          "zorixa-card-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-zorixa-card shadow-glow",
          (actionTab === "Video to Video" || actionTab === "Reference to Video") &&
            "min-h-[min(42vh,320px)]"
        )}
        style={{ maxHeight: cardMaxHeight }}
      >
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4 max-lg:py-2">
          <h2 className="font-display text-sm font-semibold text-white max-lg:text-xs">Video Preview</h2>
          {isExample ? (
            <span className="rounded-md bg-brand/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-light">
              Example
            </span>
          ) : null}
          {directorResult ? (
            <span className="rounded-md bg-[#8338eb]/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#c084fc]">
              AI Director
            </span>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center gap-2 max-lg:hidden">
            <Button
              type="button"
              variant="ghost"
              disabled={!canPostProcessVideo || postProcessBusy || loading}
              onClick={() => onUpscaleVideo?.()}
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Upscale Video
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!canPostProcessVideo || postProcessBusy || loading}
              onClick={() => onExtendVideo?.()}
              className="h-8 shrink-0 rounded-lg border border-white/10 bg-transparent px-3 text-xs text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
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
          {showPromptThumb ? (
            <div className="flex shrink-0 justify-center pt-3">
              <div className="relative size-16 overflow-hidden rounded-lg ring-1 ring-[rgba(131,56,235,0.25)]">
                <Image src={promptThumbUrl!} alt={studioReferenceImageAlt("video")} fill className="object-cover" unoptimized />
              </div>
            </div>
          ) : null}

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="scrollbar-hide flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto p-4 sm:p-6">
              {showInPreviewModelTip ? (
                <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-5 py-2">
                  {previewPlaceholderHero}
                  {actionTab === "Video to Video" ? (
                    <VideoToVideoModelTip composerModelId={composerModelId} className="w-full" />
                  ) : null}
                  {actionTab === "Reference to Video" ? (
                    <SeedanceReferenceToVideoTip
                      composerModelId={composerModelId}
                      className="w-full"
                    />
                  ) : null}
                </div>
              ) : videoUrl && !errorMessage ? (
                <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center gap-3">
                  <div
                    className={cn(
                      "relative mx-auto max-h-[min(70vh,100%)] overflow-hidden rounded-xl shadow-[0_0_24px_rgba(131,56,235,0.2)] ring-1 ring-[rgba(131,56,235,0.15)]",
                      frameAspectClass,
                      frameLayoutClass
                    )}
                  >
                    <video
                      key={videoUrl ? `zorixa-preview:${videoUrl}` : "zorixa-preview:empty"}
                      controls
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      playsInline
                      preload="auto"
                      {...domVideoAttrs}
                      className="size-full object-contain bg-black"
                      onContextMenu={(e) => e.preventDefault()}
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
                          if (
                            !playbackConfirmedRef.current &&
                            Number.isFinite(el.duration) &&
                            el.duration > 0
                          ) {
                            playbackConfirmedRef.current = true;
                            onPlaybackConfirmed?.();
                          }
                        } else {
                          setInlinePlaybackError(
                            "This video file looks empty or unreadable (0×0). Try Generate again at 4K, or download if the link still works."
                          );
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
                        const code = el.error?.code;
                        if (process.env.NODE_ENV === "development") {
                          console.warn("[VideoPreview] playback issue", {
                            code,
                            currentSrc: el.currentSrc
                          });
                        }
                        if (code === 4) {
                          setInlinePlaybackError(
                            "This output uses a format or codec your browser can't play inline (common with some Atlas / OSS files). Open in a new tab or download."
                          );
                        } else if (code != null) {
                          setInlinePlaybackError(
                            "Video playback failed in the browser. Try Download, or regenerate at 4K (Atlas Cloud)."
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
                      <button
                        type="button"
                        disabled={!canonicalDownloadUrl || downloadBusy}
                        onClick={() => void onDownloadClick()}
                        className="mt-2 inline-block font-medium text-amber-200 underline underline-offset-2 hover:text-white disabled:opacity-60"
                      >
                        {downloadBusy ? "Downloading…" : "Download MP4 via Zorixa"}
                      </button>
                    </div>
                  ) : null}
                  {directorResult ? (
                    <DirectorResultBanner
                      modelLabel={directorResult.modelLabel}
                      styleLabel={directorResult.styleLabel}
                      creditsSpent={directorResult.creditsSpent}
                      loading={directorResultLoading}
                      canTryAnother={directorResult.canTryAnother}
                      onRegenerate={directorResult.onRegenerate}
                      onTryAnother={directorResult.onTryAnother}
                    />
                  ) : null}
                </div>
              ) : loading && generationProgress ? (
                <VideoGenerationProgress
                  modelLabel={generationProgress.modelLabel}
                  composerModelId={generationProgress.composerModelId}
                  elapsedSec={generationProgress.elapsedSec}
                  directorRouted={generationProgress.directorRouted}
                  tip={generationProgress.tip}
                  showSlowBanner={generationProgress.showSlowBanner}
                  canTryAnother={generationProgress.canTryAnother}
                  onCancel={generationProgress.onCancel}
                  onKeepWaiting={generationProgress.onKeepWaiting}
                  onTryAnother={generationProgress.onTryAnother}
                />
              ) : errorMessage ? (
                <div className="max-w-md px-4 text-center">
                  <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-red-300/90">
                    Generation failed
                  </p>
                  <p className="whitespace-pre-wrap break-words text-left text-xs leading-relaxed text-red-400/95">
                    {errorMessage}
                  </p>
                  {isInsufficientCreditsMessage(errorMessage) ? (
                    <Link
                      href="/pricing"
                      className="mt-4 inline-flex rounded-lg bg-[#00e5ff] px-4 py-2 text-xs font-bold text-black transition-opacity hover:opacity-90"
                    >
                      View plans
                    </Link>
                  ) : null}
                </div>
              ) : (
                previewPlaceholderHero
              )}
            </div>

            {downloadError ? (
              <p className="pointer-events-none absolute bottom-14 left-4 right-4 z-10 text-center text-xs text-red-400/95">
                {downloadError}
              </p>
            ) : null}

            <div className="pointer-events-none absolute bottom-2 right-2 z-10 flex flex-wrap justify-end gap-1.5 max-lg:left-2 sm:bottom-3 sm:right-3 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={postProcessBusy || loading}
                onClick={() => onResetDefaults?.()}
                className="pointer-events-auto h-9 rounded-lg border border-white/15 bg-black/40 px-2.5 text-xs text-white backdrop-blur hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-45 max-lg:px-2 sm:px-3"
              >
                <RotateCcw className="size-3.5 max-lg:mr-0 sm:mr-1" />
                <span className="max-lg:sr-only sm:not-sr-only">Reset to Defaults</span>
              </Button>
              {videoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!canonicalDownloadUrl || downloadBusy}
                  onClick={() => void onDownloadClick()}
                  className="pointer-events-auto h-9 rounded-lg border border-brand/50 bg-black/30 px-2.5 text-xs font-medium text-white hover:bg-brand/20 disabled:opacity-60 max-lg:px-2 sm:px-3"
                >
                  <Download className="size-3.5 max-lg:mr-0 sm:mr-1" />
                  <span className="max-lg:sr-only sm:not-sr-only">
                    {downloadBusy ? "Downloading…" : "Download MP4"}
                  </span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  disabled
                  className="pointer-events-auto h-9 cursor-not-allowed rounded-lg border border-white/10 bg-black/20 px-2.5 text-xs text-zorixa-muted opacity-50 max-lg:px-2 sm:px-3"
                >
                  <Download className="size-3.5 max-lg:mr-0 sm:mr-1" />
                  <span className="max-lg:sr-only sm:not-sr-only">Download</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
