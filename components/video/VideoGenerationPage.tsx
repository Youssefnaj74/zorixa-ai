"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { AuthRequiredModal } from "@/components/onboarding/AuthRequiredModal";
import { InsufficientCreditsModal } from "@/components/onboarding/InsufficientCreditsModal";
import {
  creditsChargedForVideoModel,
  formatGenerationCreditsLine
} from "@/lib/atlas-pricing-catalog";
import { useCredits } from "@/lib/hooks/use-credits";
import { insufficientCreditsMessage } from "@/lib/insufficient-credits-message";
import {
  CLOSED_INSUFFICIENT_CREDITS,
  shouldBlockForInsufficientCredits,
  type InsufficientCreditsState
} from "@/lib/generation-credits-gate";
import {
  trackFirstGenerationCompleted,
  trackFirstGenerationStarted
} from "@/lib/generation-analytics";
import { GENERATION_AUTH_MESSAGE } from "@/lib/generation-api-errors";
import { usePageViewEvent } from "@/lib/hooks/use-page-view-event";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { composerModelDisplayLabel } from "@/lib/composer-model-label";
import { getVideoModelShowcase, showcaseVideoAssetUrl } from "@/lib/video-model-showcase";
import {
  VIDEO_GENERATION_CANCEL_MESSAGE,
  VIDEO_SLOW_GENERATION_SEC,
  videoGenerationContextTip
} from "@/lib/video-generation-progress";
import { directorStyleLabel } from "@/lib/ai-director/config";
import {
  getDirectorExamples,
  getNextDirectorModelInChain
} from "@/lib/ai-director/model-info";
import { resolveDirectorRoute, directorSpeedTierForQualityPreset } from "@/lib/ai-director/router";
import {
  clampDirectorDurationToOptions,
  getDirectorDurationOptions,
  normalizeDirectorDurationSeconds,
  directorDefaultDurationForStyle,
  DIRECTOR_LAUNCH_DEFAULT_DURATION_SEC,
} from "@/lib/ai-director/duration-options";
import {
  clampDirectorAspectToOptions,
  directorDefaultAspectForStyle,
  DIRECTOR_LAUNCH_DEFAULT_ASPECT,
  getDirectorAspectOptions,
  type DirectorAspectRatio,
} from "@/lib/ai-director/aspect-options";
import type {
  DirectorExample,
  DirectorQualityPreset,
  DirectorRouteResult,
  DirectorStyleInput
} from "@/lib/ai-director/types";

import { AiDirectorBottomBar } from "@/components/video/AiDirectorBottomBar";
import type { ActionTab } from "@/components/video/ActionTabsRow";
import type { VideoGenerateContext } from "@/components/video/VideoBottomBar";
import {
  resolveMotionControlAtlasPrompt,
  KLING_MOTION_CREDIT_ESTIMATE_SECONDS,
  type KlingMotionCharacterOrientation
} from "@/lib/atlas-kling-motion-control";
import {
  KLING_26_MOTION_COMPOSER_ID,
  KLING_30_PRO_MODEL_ID,
  bottomBarModelsForActionTab,
  happyHorseVideoEditMaxImages,
  happyHorseVideoEditSupportsReferenceImages,
  normalizeVeo31ComposerSettings,
  referenceToVideoMaxImages,
  wan27VideoEditMaxImages,
  wan27VideoEditSupportsReferenceImages,
  videoComposerSupportsEndFrame,
  videoComposerSupportsReferenceToVideo,
  videoComposerSupports4k,
  characterSwapTabSupportsModel,
  videoComposerSupportsVideoEditTab,
  videoToVideoTabUsesDualAssetPipeline,
  videoToVideoTabUsesKlingMotion,
  videoToVideoTabUsesWanCharacterSwap,
  videoToVideoTabUsesViduStartEnd,
  videoComposerUsesTextOnlyLayout,
  isWan26ComposerId,
  type Wan26ShotType,
  GEMINI_OMNI_FLASH_I2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_MAX_IMAGES,
  GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS,
  GEMINI_OMNI_FLASH_R2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_T2V_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID,
  HAILUO_23_COMPOSER_ID,
  HAILUO_23_T2V_DURATION_SECONDS,
  isHailuo23ComposerId,
  normalizeHailuo23I2vDurationSeconds,
  geminiOmniFlashAspectFromUi,
  grokImagineVideoAspectFromUi,
  isGeminiOmniFlashComposerId,
  isGrokImagineVideoComposerId,
  klingV3AspectFromUi,
  normalizeKlingV3DurationSeconds,
  normalizeGeminiOmniFlashDurationSeconds,
  normalizeGeminiOmniFlashReferenceDurationSeconds,
  normalizeGrokImagineVideoDurationSeconds,
  normalizeGrokImagineVideoReferenceDurationSeconds,
  type KlingV3ShotMode
} from "@/components/video/bottom-bar-models";
import {
  normalizeSeedanceReferenceDurationSeconds,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS
} from "@/lib/atlas-seedance-reference-video";
import {
  normalizeViduDurationSeconds,
  VIDU_Q3_COMPOSER_ID,
  VIDU_Q3_PRO_COMPOSER_ID
} from "@/lib/atlas-vidu-video";
import type { VideoHistoryEntry, VideoHistorySettingsSnapshot } from "@/components/video/VideoHistory";
import {
  isAtlasVideoComposerId,
  normalizeAtlasVideoSpeedTier,
  videoComposerSupportsSpeedTier
} from "@/lib/atlas-video-model-ids";
import { videoComposerSupportsGenerateAudio } from "@/lib/atlas-video-generate-audio";
import {
  DEFAULT_AUDIO_TO_VIDEO_RESOLUTION,
  INFINITETALK_COMPOSER_ID,
  isAudioToVideoComposerId,
  isAudioToVideoResolution,
  normalizeAudioToVideoResolution
} from "@/lib/atlas-audio-to-video";
import {
  HAPPYHORSE_1_COMPOSER_ID,
  isHappyHorseComposerId,
  normalizeHappyHorseDurationSeconds
} from "@/lib/atlas-happyhorse-video";
import {
  isWan27ComposerId,
  normalizeWan27DurationSeconds,
  normalizeWan27ReferenceDurationSeconds
} from "@/lib/atlas-wan-27-video";
import {
  isVeo31ComposerId,
  normalizeVeo31DurationSeconds,
  normalizeVeo31ReferenceDurationSeconds,
  VEO_31_REFERENCE_DURATION_SECONDS
} from "@/lib/atlas-veo31-video";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  clearClientMediaBlob,
  humanizeClientFetchError,
  resolvePublicHttpsMediaUrl,
  scheduleClientMediaPublicUpload
} from "@/lib/upload-client-media";
import {
  extractAtlasVideoOutputUrl,
  type AtlasLikeVideoPayload
} from "@/lib/extract-atlas-video-output-url";
import { normalizeAtlasVideoUrlForPlayback, videoUrlLooksLikeMp4Path } from "@/lib/resolve-video-playback-url";
import { extractCanonicalVideoUrlFromProxy } from "@/lib/video-playback-proxy";
import {
  ATLAS_VIDEO_UPSCALER_COMPOSER_ID,
  normalizeAtlasVideoUpscalerTarget
} from "@/lib/atlas-video-upscaler";
import {
  formatAtlasVideoFailureForUi,
  isAtlasRealPersonImageError
} from "@/lib/atlas-video-failure-message";
import { parseVideoResolutionFromQuery, resolveVideoStudioFromQuery } from "@/lib/studio-catalog-link";
import {
  appendSeedanceReferenceTokenToPrompt,
  ensureSeedanceReferenceTokensInPrompt,
  removeSeedanceReferenceTokenFromPrompt,
  type SeedanceReferenceMediaKind
} from "@/lib/seedance-reference-prompt-tokens";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";
import { seedanceComposerSupportsReferenceMedia } from "@/lib/atlas-seedance-reference-video";
import {
  wan27ComposerSupportsReferenceMedia,
  WAN_27_REFERENCE_MAX_VIDEOS,
  WAN_27_REFERENCE_MAX_VOICE_AUDIOS
} from "@/lib/atlas-wan-27-video";
import {
  COMPOSER_DOCK_WITH_TABS_HEIGHT,
  VIDEO_SEEDANCE_R2V_DOCK_HEIGHT,
  VIDEO_WAN_R2V_DOCK_HEIGHT
} from "@/lib/composer-dock-height";
import { buildSameOriginVideoPlaybackUrl } from "@/lib/video-playback-proxy";
import { isAtlasVideoTerminalSuccessStatus } from "@/lib/atlas-video-terminal-status";
import { VideoBottomBar } from "@/components/video/VideoBottomBar";
import { VideoHistory } from "@/components/video/VideoHistory";
import { VideoPreview } from "@/components/video/VideoPreview";

import { useStudioNavOffset } from "@/lib/hooks/use-studio-nav-offset";

const ATLAS_CLIENT_POLL_MS = 3000;
const ATLAS_CLIENT_MAX_WAIT_MS = 15 * 60 * 1000;

function atlasPollActionForTab(
  tab: ActionTab
): "text" | "image" | "reference" {
  if (tab === "Image to Video") return "image";
  if (tab === "Reference to Video") return "reference";
  return "text";
}

function videoPricingRouteAction(
  tab: ActionTab
): "text" | "image" | undefined {
  if (tab === "Text to Video") return "text";
  if (tab === "Image to Video") return "image";
  return undefined;
}

/** POST /api/generate-video returns snake_case; tolerate camelCase if a proxy changes keys. */
function pickPredictionIdFromPost(data: {
  prediction_id?: string;
  predictionId?: string;
}): string | null {
  const snake = typeof data.prediction_id === "string" ? data.prediction_id.trim() : "";
  if (snake.length > 0) return snake;
  const camel = typeof data.predictionId === "string" ? data.predictionId.trim() : "";
  return camel.length > 0 ? camel : null;
}

/** GET poll: top-level `video_url` from API, then Atlas `outputs` / nested shapes. */
function pickVideoUrlFromPollBody(data: Record<string, unknown>): string | null {
  for (const v of [data.video_url, data.videoUrl]) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return extractAtlasVideoOutputUrl(data as unknown as AtlasLikeVideoPayload);
}

/** Same-origin playback URL (cookie session) → 302 to CDN; falls back to raw if host not allowlisted. */
function toBrowserVideoSrc(canonicalHttps: string): string {
  if (typeof window === "undefined") return canonicalHttps;
  return buildSameOriginVideoPlaybackUrl(canonicalHttps, window.location.origin);
}

const ensureAtlasPublicHttpsMediaUrl = resolvePublicHttpsMediaUrl;

function scheduleBlobPublicUpload(
  blobUrl: string,
  file: File,
  apply: (https: string) => void,
  onError?: (message: string) => void
): void {
  scheduleClientMediaPublicUpload(blobUrl, file, apply, onError);
}

function resizeReferenceImageUrls(
  prev: (string | null)[],
  max: number
): (string | null)[] {
  for (let i = max; i < prev.length; i++) {
    const url = prev[i];
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      clearClientMediaBlob(url);
    }
  }
  const next = prev.slice(0, max);
  while (next.length < max) next.push(null);
  return next;
}

function logDirectorRunToApi(payload: {
  style_requested: DirectorStyleInput;
  style_resolved: string;
  routed_model: string;
  route_action: "text" | "image";
  prompt: string;
  success: boolean;
  prediction_id?: string | null;
  output_url?: string | null;
  credits_spent?: number;
}): Promise<number | null> {
  return fetch("/api/director/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { run_id?: number };
      return data.run_id ?? null;
    })
    .catch(() => null);
}

function logAtlasComposerVideoToSupabase(payload: {
  output_url: string;
  input_url?: string;
  prediction_id?: string | null;
  video_model?: string | null;
  credits_spent?: number;
}): Promise<number | null> {
  return fetch("/api/generations/atlas-video-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      output_url: payload.output_url,
      input_url: payload.input_url ?? "",
      prediction_id: payload.prediction_id ?? null,
      video_model: payload.video_model ?? null,
      credits_spent: payload.credits_spent ?? 0
    })
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { generation_id?: number | null };
      return typeof data.generation_id === "number" ? data.generation_id : null;
    })
    .catch(() => null);
}

export function VideoGenerationPage() {
  usePageViewEvent(AnalyticsEvents.VIDEO_STUDIO_VIEWED);
  const studioNavOffset = useStudioNavOffset();
  const { credits, refresh: refreshCredits } = useCredits();
  const searchParams = useSearchParams();
  const [bottomBarHeight, setBottomBarHeight] = useState(COMPOSER_DOCK_WITH_TABS_HEIGHT);

  const [modeValue, setModeValue] = useState("UGC");

  const [composerModelId, setComposerModelId] = useState("seedance-2");
  const [generateAudioOn, setGenerateAudioOn] = useState(false);
  const [durationStandard, setDurationStandard] = useState("Standard");
  const [timeSeconds, setTimeSeconds] = useState(10);
  const [aspect, setAspect] = useState("9:16");
  const [resolution, setResolution] = useState("1080p");
  const [wan26ShotType, setWan26ShotType] = useState<Wan26ShotType>("single");
  const [klingV3ShotMode, setKlingV3ShotMode] = useState<KlingV3ShotMode>("single");
  const [actionTab, setActionTab] = useState<ActionTab>("Text to Video");
  const [directorStyle, setDirectorStyle] = useState<DirectorStyleInput>("auto");
  const [directorQualityPreset, setDirectorQualityPreset] =
    useState<DirectorQualityPreset>("balanced");
  const [directorSoundtrackOn, setDirectorSoundtrackOn] = useState(true);
  const [directorDurationSec, setDirectorDurationSec] = useState(
    DIRECTOR_LAUNCH_DEFAULT_DURATION_SEC
  );
  const [directorAspectRatio, setDirectorAspectRatio] = useState<DirectorAspectRatio>(
    DIRECTOR_LAUNCH_DEFAULT_ASPECT
  );
  const [directorActiveExampleId, setDirectorActiveExampleId] = useState<string | null>(null);
  const [directorForceModelId, setDirectorForceModelId] = useState<string | null>(null);
  const [directorLastRoute, setDirectorLastRoute] = useState<DirectorRouteResult | null>(null);
  const [directorLastCreditsSpent, setDirectorLastCreditsSpent] = useState(0);
  const directorRunIdRef = useRef<number | null>(null);
  const directorForceModelIdRef = useRef<string | null>(null);
  const directorAutoResolvedStyleRef = useRef<DirectorRouteResult["styleResolved"] | null>(null);
  directorForceModelIdRef.current = directorForceModelId;
  const [prompt, setPrompt] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState<InsufficientCreditsState>(
    CLOSED_INSUFFICIENT_CREDITS
  );
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);

  const [promptImageUrl, setPromptImageUrl] = useState<string | null>(null);
  const [promptImage2Url, setPromptImage2Url] = useState<string | null>(null);
  const [lipsyncAudioUrl, setLipsyncAudioUrl] = useState<string | null>(null);
  const [editSourceVideoUrl, setEditSourceVideoUrl] = useState<string | null>(null);
  const [motionVideoUrl, setMotionVideoUrl] = useState<string | null>(null);
  const [characterOrientation, setCharacterOrientation] =
    useState<KlingMotionCharacterOrientation>("image");
  const [keepOriginalSound, setKeepOriginalSound] = useState(true);
  const [referenceImageUrls, setReferenceImageUrls] = useState<(string | null)[]>(() =>
    Array.from({ length: referenceToVideoMaxImages("seedance-2") }, () => null)
  );
  const [referenceVideoUrls, setReferenceVideoUrls] = useState<(string | null)[]>(() =>
    Array.from({ length: SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS }, () => null)
  );
  const [referenceAudioUrls, setReferenceAudioUrls] = useState<(string | null)[]>(() =>
    Array.from({ length: SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS }, () => null)
  );

  const syncSeedanceRefTokenInPrompt = useCallback(
    (kind: SeedanceReferenceMediaKind, index: number, url: string | null) => {
      if (
        actionTab !== "Reference to Video" ||
        !seedanceComposerSupportsReferenceMedia(composerModelId)
      ) {
        return;
      }
      setPrompt((p) =>
        url
          ? appendSeedanceReferenceTokenToPrompt(p, kind, index)
          : removeSeedanceReferenceTokenFromPrompt(p, kind, index)
      );
    },
    [actionTab, composerModelId]
  );

  const setReferenceImageAt = useCallback(
    (index: number, url: string | null, file?: File | null) => {
      setReferenceImageUrls((prev) => {
        const next = [...prev];
        const old = next[index];
        if (old?.startsWith("blob:") && old !== url) {
          URL.revokeObjectURL(old);
          clearClientMediaBlob(old);
        }
        next[index] = url;
        return next;
      });
      syncSeedanceRefTokenInPrompt("image", index, url);
      if (url?.startsWith("blob:") && file) {
        const blobUrl = url;
        scheduleBlobPublicUpload(
          blobUrl,
          file,
          (https) => {
            setReferenceImageUrls((prev) => {
              if (prev[index] !== blobUrl) return prev;
              const next = [...prev];
              next[index] = https;
              return next;
            });
          },
          setGenerateError
        );
      }
    },
    [syncSeedanceRefTokenInPrompt]
  );

  const setReferenceVideoAt = useCallback(
    (index: number, url: string | null, file?: File | null) => {
      setReferenceVideoUrls((prev) => {
        const next = [...prev];
        const old = next[index];
        if (old?.startsWith("blob:") && old !== url) {
          URL.revokeObjectURL(old);
          clearClientMediaBlob(old);
        }
        next[index] = url;
        return next;
      });
      syncSeedanceRefTokenInPrompt("video", index, url);
      if (url?.startsWith("blob:") && file) {
        const blobUrl = url;
        scheduleBlobPublicUpload(
          blobUrl,
          file,
          (https) => {
            setReferenceVideoUrls((prev) => {
              if (prev[index] !== blobUrl) return prev;
              const next = [...prev];
              next[index] = https;
              return next;
            });
          },
          setGenerateError
        );
      }
    },
    [syncSeedanceRefTokenInPrompt]
  );

  const setReferenceAudioAt = useCallback(
    (index: number, url: string | null, file?: File | null) => {
      setReferenceAudioUrls((prev) => {
        const next = [...prev];
        const old = next[index];
        if (old?.startsWith("blob:") && old !== url) {
          URL.revokeObjectURL(old);
          clearClientMediaBlob(old);
        }
        next[index] = url;
        return next;
      });
      syncSeedanceRefTokenInPrompt("audio", index, url);
      if (url?.startsWith("blob:") && file) {
        const blobUrl = url;
        scheduleBlobPublicUpload(
          blobUrl,
          file,
          (https) => {
            setReferenceAudioUrls((prev) => {
              if (prev[index] !== blobUrl) return prev;
              const next = [...prev];
              next[index] = https;
              return next;
            });
          },
          setGenerateError
        );
      }
    },
    [syncSeedanceRefTokenInPrompt]
  );

  const setPromptImageUrlSafe = useCallback((url: string | null, file?: File | null) => {
    setPromptImageUrl((prev) => {
      if (prev?.startsWith("blob:") && prev !== url) {
        URL.revokeObjectURL(prev);
        clearClientMediaBlob(prev);
      }
      return url;
    });
    if (url?.startsWith("blob:") && file) {
      const blobUrl = url;
      scheduleBlobPublicUpload(
        blobUrl,
        file,
        (https) => {
          setPromptImageUrl((current) => {
            if (current !== blobUrl) return current;
            return https;
          });
        },
        setGenerateError
      );
    }
  }, []);

  const setPromptImage2UrlSafe = useCallback((url: string | null, file?: File | null) => {
    setPromptImage2Url((prev) => {
      if (prev?.startsWith("blob:") && prev !== url) {
        URL.revokeObjectURL(prev);
        clearClientMediaBlob(prev);
      }
      return url;
    });
    if (url?.startsWith("blob:") && file) {
      const blobUrl = url;
      scheduleBlobPublicUpload(
        blobUrl,
        file,
        (https) => {
          setPromptImage2Url((current) => {
            if (current !== blobUrl) return current;
            return https;
          });
        },
        setGenerateError
      );
    }
  }, []);

  const setLipsyncAudioUrlSafe = useCallback((url: string | null, file?: File | null) => {
    setLipsyncAudioUrl((prev) => {
      if (prev?.startsWith("blob:") && prev !== url) {
        URL.revokeObjectURL(prev);
        clearClientMediaBlob(prev);
      }
      return url;
    });
    if (url?.startsWith("blob:") && file) {
      const blobUrl = url;
      scheduleBlobPublicUpload(
        blobUrl,
        file,
        (https) => {
          setLipsyncAudioUrl((current) => {
            if (current !== blobUrl) return current;
            return https;
          });
        },
        setGenerateError
      );
    }
  }, []);

  const setEditSourceVideoUrlSafe = useCallback((url: string | null, file?: File | null) => {
    setEditSourceVideoUrl((prev) => {
      if (prev?.startsWith("blob:") && prev !== url) {
        URL.revokeObjectURL(prev);
        clearClientMediaBlob(prev);
      }
      return url;
    });
    if (url?.startsWith("blob:") && file) {
      const blobUrl = url;
      scheduleBlobPublicUpload(
        blobUrl,
        file,
        (https) => {
          setEditSourceVideoUrl((current) => {
            if (current !== blobUrl) return current;
            return https;
          });
        },
        setGenerateError
      );
    }
  }, []);

  const setMotionVideoUrlSafe = useCallback((url: string | null, file?: File | null) => {
    setMotionVideoUrl((prev) => {
      if (prev?.startsWith("blob:") && prev !== url) {
        URL.revokeObjectURL(prev);
        clearClientMediaBlob(prev);
      }
      return url;
    });
    if (url?.startsWith("blob:") && file) {
      const blobUrl = url;
      scheduleBlobPublicUpload(
        blobUrl,
        file,
        (https) => {
          setMotionVideoUrl((current) => {
            if (current !== blobUrl) return current;
            return https;
          });
        },
        setGenerateError
      );
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [directorGenElapsedSec, setDirectorGenElapsedSec] = useState(0);
  const [directorSlowBannerDismissed, setDirectorSlowBannerDismissed] = useState(false);
  const directorGenStartRef = useRef<number | null>(null);
  const [activeGenMeta, setActiveGenMeta] = useState<{
    modelId: string;
    isDirector: boolean;
    actionTab: ActionTab;
    directorStyle?: string;
    directorQualityPreset?: DirectorQualityPreset;
    generateAudioOn?: boolean;
    isUpscale?: boolean;
  } | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);
  const generationUserCancelledRef = useRef(false);
  const pendingMirrorGenerationIdRef = useRef<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  /** Raw Atlas/CDN URL for full-file download (playback uses proxied `videoUrl`). */
  const [videoDownloadUrl, setVideoDownloadUrl] = useState<string | null>(null);
  const [hasUserGenerated, setHasUserGenerated] = useState(false);

  const [history, setHistory] = useState<VideoHistoryEntry[]>([]);
  const appliedShowcaseForModel = useRef<string | null>(null);

  const modelShowcase = useMemo(
    () => (actionTab === "AI Director" ? null : getVideoModelShowcase(composerModelId, actionTab)),
    [actionTab, composerModelId]
  );
  const [showcaseAssetsReady, setShowcaseAssetsReady] = useState(false);

  useEffect(() => {
    if (!modelShowcase) {
      setShowcaseAssetsReady(true);
      return;
    }

    if (actionTab === "Image to Video") {
      let cancelled = false;
      setShowcaseAssetsReady(false);
      const check = async () => {
        const urls = [modelShowcase.videoUrl, modelShowcase.startFrameImageUrl].filter(
          (u): u is string => typeof u === "string" && u.trim().length > 0
        );
        try {
          const results = await Promise.all(
            urls.map(async (path) => {
              const res = await fetch(path, { method: "HEAD", cache: "no-store" });
              return res.ok;
            })
          );
          if (!cancelled) setShowcaseAssetsReady(results.every(Boolean));
        } catch {
          if (!cancelled) setShowcaseAssetsReady(false);
        }
      };
      void check();
      return () => {
        cancelled = true;
      };
    }

    if (actionTab === "Audio to Video") {
      let cancelled = false;
      setShowcaseAssetsReady(false);
      const check = async () => {
        const urls = [modelShowcase.videoUrl, modelShowcase.portraitImageUrl, modelShowcase.audioUrl].filter(
          (u): u is string => typeof u === "string" && u.trim().length > 0
        );
        try {
          const results = await Promise.all(
            urls.map(async (path) => {
              const res = await fetch(path, { method: "HEAD", cache: "no-store" });
              return res.ok;
            })
          );
          if (!cancelled) setShowcaseAssetsReady(results.every(Boolean));
        } catch {
          if (!cancelled) setShowcaseAssetsReady(false);
        }
      };
      void check();
      return () => {
        cancelled = true;
      };
    }

    if (actionTab === "Video to Video") {
      let cancelled = false;
      setShowcaseAssetsReady(false);
      const check = async () => {
        const urls = [
          modelShowcase.videoUrl,
          modelShowcase.characterImageUrl,
          modelShowcase.motionClipUrl
        ].filter((u): u is string => typeof u === "string" && u.trim().length > 0);
        try {
          const results = await Promise.all(
            urls.map(async (path) => {
              const res = await fetch(path, { method: "HEAD", cache: "no-store" });
              return res.ok;
            })
          );
          if (!cancelled) setShowcaseAssetsReady(results.every(Boolean));
        } catch {
          if (!cancelled) setShowcaseAssetsReady(false);
        }
      };
      void check();
      return () => {
        cancelled = true;
      };
    }

    setShowcaseAssetsReady(true);
  }, [actionTab, modelShowcase]);

  const showingModelShowcase = Boolean(
    modelShowcase && showcaseAssetsReady && !videoUrl && !loading && !hasUserGenerated
  );
  const inputPreviewVideoUrl = useMemo(() => {
    if (actionTab === "Video to Video") {
      if (videoToVideoTabUsesDualAssetPipeline(composerModelId) && motionVideoUrl) {
        return motionVideoUrl;
      }
      if (videoComposerSupportsVideoEditTab(composerModelId) && editSourceVideoUrl) {
        return editSourceVideoUrl;
      }
    }
    if (actionTab === "Reference to Video") {
      const firstRefVideo = referenceVideoUrls.find((url): url is string => Boolean(url));
      if (firstRefVideo) return firstRefVideo;
    }
    return null;
  }, [
    actionTab,
    composerModelId,
    editSourceVideoUrl,
    motionVideoUrl,
    referenceVideoUrls
  ]);

  const previewVideoUrl = useMemo(() => {
    if (showingModelShowcase && modelShowcase) {
      return showcaseVideoAssetUrl(modelShowcase.videoUrl);
    }
    if (videoUrl) return videoUrl;
    return inputPreviewVideoUrl;
  }, [inputPreviewVideoUrl, modelShowcase, showingModelShowcase, videoUrl]);

  const historyItems = useMemo(() => {
    if (!showingModelShowcase || !modelShowcase) return history;
    const exampleEntry: VideoHistoryEntry = {
      id: `showcase-${modelShowcase.modelId}`,
      thumb: modelShowcase.posterUrl,
      title: modelShowcase.historyTitle,
      subtitle: `Example · ${composerModelDisplayLabel(modelShowcase.modelId, "video")}`,
      outputVideoUrl: modelShowcase.videoUrl
    };
    return [exampleEntry, ...history];
  }, [history, modelShowcase, showingModelShowcase]);

  const directorPreviewRoute = useMemo(() => {
    if (actionTab !== "AI Director") return null;
    return resolveDirectorRoute({
      style: directorStyle,
      prompt: prompt.trim(),
      hasStartImage: Boolean(promptImageUrl),
      qualityPreset: directorQualityPreset,
      forceModelId: directorForceModelId
    });
  }, [
    actionTab,
    directorForceModelId,
    directorQualityPreset,
    directorStyle,
    prompt,
    promptImageUrl
  ]);

  const directorDurationOptions = useMemo(() => {
    if (!directorPreviewRoute) return [5];
    return getDirectorDurationOptions(
      directorPreviewRoute.modelId,
      directorPreviewRoute.routeAction
    );
  }, [directorPreviewRoute]);

  const directorAspectOptions = useMemo(() => {
    if (!directorPreviewRoute) return [...getDirectorAspectOptions("seedance-2")];
    return getDirectorAspectOptions(directorPreviewRoute.modelId);
  }, [directorPreviewRoute]);

  useEffect(() => {
    if (!directorPreviewRoute) return;
    setDirectorDurationSec((current) =>
      clampDirectorDurationToOptions(directorDurationOptions, current)
    );
  }, [directorDurationOptions, directorPreviewRoute]);

  useEffect(() => {
    if (!directorPreviewRoute) return;
    setDirectorAspectRatio((current) =>
      clampDirectorAspectToOptions(directorAspectOptions, current)
    );
  }, [directorAspectOptions, directorPreviewRoute]);

  useEffect(() => {
    if (!directorPreviewRoute || directorStyle !== "auto") return;
    const resolved = directorPreviewRoute.styleResolved;
    if (directorAutoResolvedStyleRef.current === resolved) return;
    directorAutoResolvedStyleRef.current = resolved;
    setDirectorDurationSec(directorDefaultDurationForStyle(resolved));
    setDirectorAspectRatio(directorDefaultAspectForStyle(resolved));
  }, [directorPreviewRoute, directorStyle]);

  const directorEstimatedCredits = useMemo(() => {
    if (!directorPreviewRoute) return 0;
    const billingActionTab = directorPreviewRoute.actionTab;
    const supportsNativeAudio =
      videoComposerSupportsGenerateAudio(directorPreviewRoute.modelId) &&
      (billingActionTab === "Text to Video" || billingActionTab === "Image to Video");
    return creditsChargedForVideoModel(directorPreviewRoute.modelId, {
      durationSeconds: directorDurationSec,
      resolution: directorPreviewRoute.resolution,
      speedTier: videoComposerSupportsSpeedTier(directorPreviewRoute.modelId)
        ? directorSpeedTierForQualityPreset(directorQualityPreset)
        : "standard",
      generateAudio: supportsNativeAudio && directorSoundtrackOn,
      routeAction: videoPricingRouteAction(billingActionTab)
    });
  }, [directorPreviewRoute, directorDurationSec, directorSoundtrackOn, directorQualityPreset]);

  const directorExamples = useMemo(() => getDirectorExamples(), []);

  const creditsLine = useMemo(
    () => {
      const billingModelId =
        actionTab === "AI Director" && directorPreviewRoute
          ? directorPreviewRoute.modelId
          : composerModelId;
      const billingActionTab =
        actionTab === "AI Director" && directorPreviewRoute
          ? directorPreviewRoute.actionTab
          : actionTab;
      const supportsNativeAudio =
        videoComposerSupportsGenerateAudio(billingModelId) &&
        (billingActionTab === "Text to Video" ||
          billingActionTab === "Image to Video" ||
          billingActionTab === "Reference to Video" ||
          (billingActionTab === "Video to Video" &&
            videoToVideoTabUsesViduStartEnd(billingModelId)));
      const directorDuration =
        actionTab === "Video to Video" && videoToVideoTabUsesKlingMotion(composerModelId)
          ? KLING_MOTION_CREDIT_ESTIMATE_SECONDS
          : actionTab === "AI Director"
            ? directorDurationSec
            : timeSeconds;
      const directorResolution =
        actionTab === "AI Director" && directorPreviewRoute
          ? directorPreviewRoute.resolution
          : resolution;
      return formatGenerationCreditsLine(
        creditsChargedForVideoModel(billingModelId, {
          durationSeconds: directorDuration,
          resolution: directorResolution,
          speedTier: videoComposerSupportsSpeedTier(billingModelId)
            ? normalizeAtlasVideoSpeedTier(durationStandard)
            : "standard",
          generateAudio: supportsNativeAudio && generateAudioOn,
          routeAction: videoPricingRouteAction(billingActionTab)
        })
      );
    },
    [
      actionTab,
      composerModelId,
      directorPreviewRoute,
      durationStandard,
      generateAudioOn,
      resolution,
      timeSeconds
    ]
  );

  const handleBottomBarHeight = useCallback((height: number) => {
    setBottomBarHeight(height);
  }, []);

  useEffect(() => {
    if (!loading) {
      directorGenStartRef.current = null;
      setDirectorGenElapsedSec(0);
      setDirectorSlowBannerDismissed(false);
      setActiveGenMeta(null);
      return;
    }
    directorGenStartRef.current = Date.now();
    setDirectorGenElapsedSec(0);
    setDirectorSlowBannerDismissed(false);
    const id = window.setInterval(() => {
      const start = directorGenStartRef.current;
      if (!start) return;
      setDirectorGenElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [loading]);

  const applyModelShowcase = useCallback(
    (nextModelId: string, tab: ActionTab) => {
      if (searchParams.get("prompt")?.trim()) return;
      if (hasUserGenerated) return;
      if (tab === "AI Director") return;

      const showcaseKey = `${nextModelId}:${tab}`;
      const showcase = getVideoModelShowcase(nextModelId, tab);
      if (!showcase) {
        appliedShowcaseForModel.current = null;
        setPrompt("");
        setPromptImageUrlSafe(null);
        setPromptImage2UrlSafe(null);
        setLipsyncAudioUrlSafe(null);
        setMotionVideoUrlSafe(null);
        setVideoUrl(null);
        setVideoDownloadUrl(null);
        return;
      }
      if (appliedShowcaseForModel.current === showcaseKey) return;

      setPrompt(showcase.prompt);
      setAspect(showcase.aspect);
      setResolution(showcase.resolution);
      setTimeSeconds(showcase.timeSeconds);
      setDurationStandard(showcase.durationStandard);
      setGenerateError(null);
      setVideoUrl(null);
      setVideoDownloadUrl(null);
      appliedShowcaseForModel.current = showcaseKey;

      if (isGrokImagineVideoComposerId(nextModelId)) {
        setAspect(grokImagineVideoAspectFromUi(showcase.aspect));
        if (showcase.resolution !== "480p" && showcase.resolution !== "720p") {
          setResolution("720p");
        }
      }
      if (isGeminiOmniFlashComposerId(nextModelId)) {
        setAspect(geminiOmniFlashAspectFromUi(showcase.aspect));
        setTimeSeconds(normalizeGeminiOmniFlashDurationSeconds(showcase.timeSeconds));
      }
      if (isVeo31ComposerId(nextModelId)) {
        const veo = normalizeVeo31ComposerSettings({
          timeSeconds: showcase.timeSeconds,
          aspect: showcase.aspect,
          resolution: showcase.resolution,
          actionTab: tab
        });
        setTimeSeconds(veo.timeSeconds);
        setAspect(veo.aspect);
        setResolution(veo.resolution);
      }
      if (isHailuo23ComposerId(nextModelId) && tab === "Text to Video") {
        setTimeSeconds(HAILUO_23_T2V_DURATION_SECONDS);
      }
      if (isHailuo23ComposerId(nextModelId) && tab === "Image to Video") {
        setTimeSeconds(normalizeHailuo23I2vDurationSeconds(showcase.timeSeconds));
      }

      if (tab === "Image to Video") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const startUrl = showcase.startFrameImageUrl
          ? showcaseVideoAssetUrl(showcase.startFrameImageUrl, origin)
          : null;

        if (nextModelId === GEMINI_OMNI_FLASH_I2V_COMPOSER_ID) {
          setPromptImageUrlSafe(null);
          setPromptImage2UrlSafe(null);
          setReferenceImageUrls(
            startUrl
              ? [startUrl, ...Array.from({ length: GEMINI_OMNI_FLASH_MAX_IMAGES - 1 }, () => null)]
              : Array.from({ length: GEMINI_OMNI_FLASH_MAX_IMAGES }, () => null)
          );
        } else {
          setPromptImageUrlSafe(startUrl);
          setPromptImage2UrlSafe(null);
          setReferenceImageUrls(Array.from({ length: referenceToVideoMaxImages(nextModelId) }, () => null));
        }
        setLipsyncAudioUrlSafe(null);
      } else if (tab === "Audio to Video") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const portraitUrl = showcase.portraitImageUrl
          ? showcaseVideoAssetUrl(showcase.portraitImageUrl, origin)
          : null;
        const audioUrl = showcase.audioUrl ? showcaseVideoAssetUrl(showcase.audioUrl, origin) : null;
        setPromptImageUrlSafe(portraitUrl);
        setPromptImage2UrlSafe(null);
        setLipsyncAudioUrlSafe(audioUrl);
        setMotionVideoUrlSafe(null);
        setReferenceImageUrls(Array.from({ length: referenceToVideoMaxImages(nextModelId) }, () => null));
      } else if (tab === "Video to Video") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const characterUrl = showcase.characterImageUrl
          ? showcaseVideoAssetUrl(showcase.characterImageUrl, origin)
          : null;
        const motionUrl = showcase.motionClipUrl
          ? showcaseVideoAssetUrl(showcase.motionClipUrl, origin)
          : null;
        setPromptImageUrlSafe(characterUrl);
        setPromptImage2UrlSafe(null);
        setLipsyncAudioUrlSafe(null);
        setMotionVideoUrlSafe(motionUrl);
        setReferenceImageUrls(Array.from({ length: referenceToVideoMaxImages(nextModelId) }, () => null));
        if (showcase.characterOrientation) {
          setCharacterOrientation(showcase.characterOrientation);
        }
        if (showcase.keepOriginalSound != null) {
          setKeepOriginalSound(showcase.keepOriginalSound);
        }
      } else {
        setPromptImageUrlSafe(null);
        setPromptImage2UrlSafe(null);
        setLipsyncAudioUrlSafe(null);
        setMotionVideoUrlSafe(null);
      }

      const urlResolution = parseVideoResolutionFromQuery(searchParams.get("resolution"));
      if (urlResolution) {
        setResolution(
          urlResolution === "4k" && !videoComposerSupports4k(nextModelId) ? "1080p" : urlResolution
        );
      }
    },
    [hasUserGenerated, searchParams, setLipsyncAudioUrlSafe, setMotionVideoUrlSafe, setPromptImage2UrlSafe, setPromptImageUrlSafe]
  );

  useEffect(() => {
    if (searchParams.get("prompt")?.trim()) return;
    if (hasUserGenerated) return;
    if (actionTab === "AI Director") return;

    const key = `${composerModelId}:${actionTab}`;
    if (appliedShowcaseForModel.current === key) return;

    applyModelShowcase(composerModelId, actionTab);
  }, [actionTab, applyModelShowcase, composerModelId, hasUserGenerated, searchParams]);

  const handleComposerModelChange = useCallback((id: string) => {
    appliedShowcaseForModel.current = null;
    setComposerModelId(id);
    setGenerateError(null);
    if (!videoComposerSupportsGenerateAudio(id)) {
      setGenerateAudioOn(false);
    } else if (isWan27ComposerId(id)) {
      setGenerateAudioOn(true);
    }
    if (!videoComposerSupportsSpeedTier(id)) {
      setDurationStandard("Standard");
    }
    if (!videoComposerSupports4k(id) && resolution === "4k") {
      setResolution("1080p");
    }
    if (isGrokImagineVideoComposerId(id)) {
      setTimeSeconds((t) =>
        id === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID
          ? normalizeGrokImagineVideoReferenceDurationSeconds(t)
          : normalizeGrokImagineVideoDurationSeconds(t)
      );
      setAspect(grokImagineVideoAspectFromUi(aspect));
      if (resolution !== "480p" && resolution !== "720p") setResolution("720p");
      if (id === GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID) setActionTab("Text to Video");
      if (id === GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID) setActionTab("Image to Video");
      if (id === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID) setActionTab("Reference to Video");
    }
    if (!videoComposerSupportsEndFrame(id)) {
      setPromptImage2UrlSafe(null);
    }
    if (isHappyHorseComposerId(id)) {
      setTimeSeconds((t) => normalizeHappyHorseDurationSeconds(t));
      if (resolution === "480p") setResolution("720p");
      const happyAspects = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;
      if (!happyAspects.includes(aspect as (typeof happyAspects)[number])) {
        setAspect("16:9");
      }
    }
    if (isHailuo23ComposerId(id)) {
      setTimeSeconds((t) =>
        actionTab === "Image to Video"
          ? normalizeHailuo23I2vDurationSeconds(t)
          : HAILUO_23_T2V_DURATION_SECONDS
      );
    }
    if (isWan27ComposerId(id)) {
      setTimeSeconds((t) =>
        actionTab === "Reference to Video"
          ? normalizeWan27ReferenceDurationSeconds(t)
          : normalizeWan27DurationSeconds(t)
      );
      if (resolution === "480p") setResolution("720p");
      const wanAspects = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;
      if (!wanAspects.includes(aspect as (typeof wanAspects)[number])) {
        setAspect("16:9");
      }
    }
    if (isVeo31ComposerId(id)) {
      const veo = normalizeVeo31ComposerSettings({
        timeSeconds,
        aspect,
        resolution,
        actionTab
      });
      setTimeSeconds(veo.timeSeconds);
      setAspect(veo.aspect);
      setResolution(veo.resolution);
    }
    if (isGeminiOmniFlashComposerId(id)) {
      setTimeSeconds((t) =>
        id === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID
          ? normalizeGeminiOmniFlashReferenceDurationSeconds(t)
          : normalizeGeminiOmniFlashDurationSeconds(t)
      );
      setAspect(geminiOmniFlashAspectFromUi(aspect));
      if (resolution === "480p") setResolution("720p");
      if (id === GEMINI_OMNI_FLASH_I2V_COMPOSER_ID) setActionTab("Image to Video");
      if (id === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID) setActionTab("Reference to Video");
    }
    if (id === KLING_30_PRO_MODEL_ID) {
      setActionTab("Text to Video");
      setTimeSeconds((t) => normalizeKlingV3DurationSeconds(t));
      setAspect(klingV3AspectFromUi(aspect));
    }
    if (actionTab === "Reference to Video") {
      if (id === VIDU_Q3_PRO_COMPOSER_ID) {
        setComposerModelId(VIDU_Q3_COMPOSER_ID);
      } else if (!videoComposerSupportsReferenceToVideo(id)) {
        setActionTab("Image to Video");
      }
    }
    if (
      actionTab === "Video to Video" &&
      !videoComposerSupportsVideoEditTab(id) &&
      !videoToVideoTabUsesViduStartEnd(id) &&
      !characterSwapTabSupportsModel(id)
    ) {
      setActionTab("Image to Video");
    }
  }, [actionTab, aspect, resolution, setPromptImage2UrlSafe, setPromptImageUrlSafe, timeSeconds]);

  useEffect(() => {
    if (actionTab === "Reference to Video" && seedanceComposerSupportsReferenceMedia(composerModelId)) {
      setBottomBarHeight(VIDEO_SEEDANCE_R2V_DOCK_HEIGHT);
    } else if (actionTab === "Reference to Video" && wan27ComposerSupportsReferenceMedia(composerModelId)) {
      setBottomBarHeight(VIDEO_WAN_R2V_DOCK_HEIGHT);
    } else {
      setBottomBarHeight(COMPOSER_DOCK_WITH_TABS_HEIGHT);
    }
  }, [actionTab, composerModelId]);

  useEffect(() => {
    if (
      actionTab === "Reference to Video" &&
      composerModelId === "seedance-2" &&
      resolution === "480p"
    ) {
      setResolution("720p");
    }
  }, [actionTab, composerModelId, resolution]);

  useEffect(() => {
    if (actionTab !== "Reference to Video") return;
    if (
      composerModelId === GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID ||
      composerModelId === GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID
    ) {
      setComposerModelId(GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID);
      return;
    }
    if (
      composerModelId === GEMINI_OMNI_FLASH_T2V_COMPOSER_ID ||
      composerModelId === GEMINI_OMNI_FLASH_I2V_COMPOSER_ID
    ) {
      setComposerModelId(GEMINI_OMNI_FLASH_R2V_COMPOSER_ID);
    }
  }, [actionTab, composerModelId]);

  useEffect(() => {
    if (actionTab !== "Reference to Video") return;
    const max = referenceToVideoMaxImages(composerModelId);
    setReferenceImageUrls((prev) => {
      if (prev.length === max) return prev;
      return resizeReferenceImageUrls(prev, max);
    });
    if (isVeo31ComposerId(composerModelId)) {
      const veo = normalizeVeo31ComposerSettings({
        timeSeconds,
        aspect,
        resolution,
        actionTab
      });
      setTimeSeconds(veo.timeSeconds);
      setAspect(veo.aspect);
      setResolution(veo.resolution);
    }
  }, [actionTab, aspect, composerModelId, resolution, timeSeconds]);

  useEffect(() => {
    if (!isVeo31ComposerId(composerModelId)) return;
    if (actionTab === "Reference to Video") return;
    const next = normalizeVeo31DurationSeconds(timeSeconds, resolution);
    if (timeSeconds !== next) setTimeSeconds(next);
  }, [actionTab, composerModelId, resolution, timeSeconds]);

  useEffect(() => {
    if (!happyHorseVideoEditSupportsReferenceImages(composerModelId, actionTab)) return;
    const max = happyHorseVideoEditMaxImages();
    setReferenceImageUrls((prev) => {
      if (prev.length === max) return prev;
      return resizeReferenceImageUrls(prev, max);
    });
  }, [actionTab, composerModelId]);

  useEffect(() => {
    if (!wan27VideoEditSupportsReferenceImages(composerModelId, actionTab)) return;
    const max = wan27VideoEditMaxImages();
    setReferenceImageUrls((prev) => {
      if (prev.length === max) return prev;
      return resizeReferenceImageUrls(prev, max);
    });
  }, [actionTab, composerModelId]);

  useEffect(() => {
    if (
      !(
        (actionTab === "Image to Video" && composerModelId === GEMINI_OMNI_FLASH_I2V_COMPOSER_ID) ||
        (actionTab === "Reference to Video" && composerModelId === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID)
      )
    ) {
      return;
    }
    setReferenceImageUrls((prev) => {
      if (prev.length === GEMINI_OMNI_FLASH_MAX_IMAGES) return prev;
      return resizeReferenceImageUrls(prev, GEMINI_OMNI_FLASH_MAX_IMAGES);
    });
    setTimeSeconds((t) =>
      composerModelId === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID
        ? normalizeGeminiOmniFlashReferenceDurationSeconds(t)
        : normalizeGeminiOmniFlashDurationSeconds(t)
    );
    setAspect((a) => geminiOmniFlashAspectFromUi(a));
    if (resolution === "480p") setResolution("720p");
    if (actionTab === "Reference to Video") {
      setReferenceVideoUrls((prev) => {
        if (prev.length === GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS) return prev;
        return resizeReferenceImageUrls(prev, GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS);
      });
    }
  }, [actionTab, composerModelId, resolution]);

  useEffect(() => {
    if (!isHailuo23ComposerId(composerModelId)) return;
    setTimeSeconds((t) =>
      actionTab === "Image to Video"
        ? normalizeHailuo23I2vDurationSeconds(t)
        : HAILUO_23_T2V_DURATION_SECONDS
    );
  }, [actionTab, composerModelId]);

  useEffect(() => {
    if (!isGrokImagineVideoComposerId(composerModelId)) return;
    setTimeSeconds((t) =>
      composerModelId === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID
        ? normalizeGrokImagineVideoReferenceDurationSeconds(t)
        : normalizeGrokImagineVideoDurationSeconds(t)
    );
    setAspect((a) => grokImagineVideoAspectFromUi(a));
    if (resolution !== "480p" && resolution !== "720p") setResolution("720p");
  }, [composerModelId, resolution]);

  useEffect(() => {
    if (actionTab !== "Reference to Video" || !wan27ComposerSupportsReferenceMedia(composerModelId)) {
      return;
    }
    const maxImg = referenceToVideoMaxImages(composerModelId);
    setReferenceImageUrls((prev) => {
      if (prev.length === maxImg) return prev;
      return resizeReferenceImageUrls(prev, maxImg);
    });
    setReferenceVideoUrls((prev) => {
      if (prev.length === WAN_27_REFERENCE_MAX_VIDEOS) return prev;
      return resizeReferenceImageUrls(prev, WAN_27_REFERENCE_MAX_VIDEOS);
    });
    setReferenceAudioUrls((prev) => {
      if (prev.length === WAN_27_REFERENCE_MAX_VOICE_AUDIOS) return prev;
      return resizeReferenceImageUrls(prev, WAN_27_REFERENCE_MAX_VOICE_AUDIOS);
    });
    setTimeSeconds((t) => normalizeWan27ReferenceDurationSeconds(t));
  }, [actionTab, composerModelId]);

  useEffect(() => {
    if (
      actionTab === "Reference to Video" &&
      composerModelId === VIDU_Q3_PRO_COMPOSER_ID
    ) {
      setComposerModelId(VIDU_Q3_COMPOSER_ID);
    }
    if (actionTab === "Audio to Video" && !isAudioToVideoComposerId(composerModelId)) {
      setComposerModelId(INFINITETALK_COMPOSER_ID);
    }
    if (
      (actionTab === "Text to Video" || actionTab === "Image to Video") &&
      isAudioToVideoComposerId(composerModelId)
    ) {
      const models = bottomBarModelsForActionTab(actionTab);
      setComposerModelId(models[0]?.id ?? "seedance-2");
    }
  }, [actionTab, composerModelId]);

  useEffect(() => {
    const resolved = resolveVideoStudioFromQuery(
      searchParams.get("tab"),
      searchParams.get("model")
    );
    if (!resolved) return;
    setActionTab(resolved.tab);
    setComposerModelId(resolved.model);
    setGenerateError(null);
    if (!videoComposerSupportsGenerateAudio(resolved.model)) {
      setGenerateAudioOn(false);
    }
    if (!videoComposerSupportsSpeedTier(resolved.model)) {
      setDurationStandard("Standard");
    }
    if (resolved.tab === "Reference to Video") {
      setTimeSeconds((t) =>
        resolved.model === VIDU_Q3_COMPOSER_ID || resolved.model === VIDU_Q3_PRO_COMPOSER_ID
          ? normalizeViduDurationSeconds(t)
          : normalizeSeedanceReferenceDurationSeconds(t)
      );
    }

    const audioParam = searchParams.get("audio");
    if (audioParam && resolved.tab === "Audio to Video") {
      const coerced = coerceToPublicHttpsUrl(audioParam.trim());
      if (coerced) {
        setLipsyncAudioUrlSafe(coerced);
        setPromptImageUrlSafe(null);
      }
    }

    const urlResolution = parseVideoResolutionFromQuery(searchParams.get("resolution"));
    if (urlResolution) {
      setResolution(
        urlResolution === "4k" && !videoComposerSupports4k(resolved.model) ? "1080p" : urlResolution
      );
      setVideoUrl(null);
      setVideoDownloadUrl(null);
      setHasUserGenerated(false);
      appliedShowcaseForModel.current = null;
    }
  }, [searchParams, setLipsyncAudioUrlSafe, setPromptImageUrlSafe]);

  useEffect(() => {
    if (composerModelId !== KLING_30_PRO_MODEL_ID) return;
    setTimeSeconds((t) => normalizeKlingV3DurationSeconds(t));
    if (actionTab === "Text to Video" || actionTab === "Image to Video") {
      setAspect((a) => klingV3AspectFromUi(a));
    }
  }, [composerModelId, actionTab]);

  const handleActionTabChange = useCallback((tab: ActionTab) => {
    appliedShowcaseForModel.current = null;
    const wasGemini = isGeminiOmniFlashComposerId(composerModelId);
    const wasGrok = isGrokImagineVideoComposerId(composerModelId);
    const wasAudioToVideo = isAudioToVideoComposerId(composerModelId);
    setActionTab(tab);
    setGenerateError(null);
    if (tab === "AI Director") {
      setPrompt("");
      setPromptImageUrlSafe(null);
      setPromptImage2UrlSafe(null);
      setVideoUrl(null);
      setVideoDownloadUrl(null);
      setHasUserGenerated(false);
      setDirectorActiveExampleId(null);
      return;
    }
    if (wasAudioToVideo && tab !== "Audio to Video") {
      setLipsyncAudioUrlSafe(null);
      if (tab === "Text to Video" || tab === "Image to Video") {
        const models = bottomBarModelsForActionTab(tab);
        setComposerModelId(models[0]?.id ?? "seedance-2");
        setResolution("1080p");
        return;
      }
    }
    if (tab === "Text to Video" && wasGrok) {
      setComposerModelId(GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID);
      return;
    }
    if (tab === "Image to Video" && wasGrok) {
      setComposerModelId(GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID);
      return;
    }
    if (tab === "Text to Video" && wasGemini) {
      setComposerModelId(GEMINI_OMNI_FLASH_T2V_COMPOSER_ID);
      return;
    }
    if (tab === "Image to Video" && wasGemini) {
      setComposerModelId(GEMINI_OMNI_FLASH_I2V_COMPOSER_ID);
      return;
    }
    if (tab === "Text to Video" && isHailuo23ComposerId(composerModelId)) {
      setTimeSeconds(HAILUO_23_T2V_DURATION_SECONDS);
      return;
    }
    if (tab === "Image to Video" && isHailuo23ComposerId(composerModelId)) {
      setTimeSeconds((t) => normalizeHailuo23I2vDurationSeconds(t));
      return;
    }
    if (tab === "Reference to Video") {
      setComposerModelId(
        wasGrok
          ? GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID
          : wasGemini
            ? GEMINI_OMNI_FLASH_R2V_COMPOSER_ID
            : "seedance-2"
      );
      setTimeSeconds((t) =>
        wasGrok
          ? normalizeGrokImagineVideoReferenceDurationSeconds(t)
          : wasGemini
            ? normalizeGeminiOmniFlashReferenceDurationSeconds(t)
            : normalizeSeedanceReferenceDurationSeconds(t)
      );
      setResolution((r) => (r === "480p" ? "720p" : r));
    }
    if (tab === "Video to Video") {
      setComposerModelId("wan-2-6");
    }
    if (tab === "Audio to Video") {
      setPromptImageUrlSafe(null);
      setComposerModelId(INFINITETALK_COMPOSER_ID);
      setResolution((r) =>
        isAudioToVideoResolution(r) ? r : DEFAULT_AUDIO_TO_VIDEO_RESOLUTION
      );
    }
  }, [composerModelId, setLipsyncAudioUrlSafe, setPromptImage2UrlSafe, setPromptImageUrlSafe]);

  const runGeneration = useCallback(
    async (ctx: VideoGenerateContext) => {
      if (loading) return;

      setGenerateError(null);
      setVideoUrl(null);
      setVideoDownloadUrl(null);

      // Merge context + React state: avoids empty prompt when Generate runs before the last onChange commits.
      const promptValue = ctx.promptText.trim() || prompt.trim();
      let promptForAtlas = stripVideoComposerAssetTokens(promptValue);

      const motionPromptOptionalEarly =
        ctx.actionTab === "Video to Video" &&
        videoToVideoTabUsesDualAssetPipeline(composerModelId);

      if (ctx.actionTab !== "AI Director" && !isAtlasVideoComposerId(composerModelId)) {
        setGenerateError("Unsupported video model.");
        return;
      }

      if (!promptValue && !motionPromptOptionalEarly) {
        setGenerateError("Enter a prompt to generate a video.");
        return;
      }

      if (!promptForAtlas && !motionPromptOptionalEarly) {
        setGenerateError("Enter a prompt (not only image placeholders) to generate a video.");
        return;
      }

      setLoading(true);
      generationUserCancelledRef.current = false;
      generationAbortRef.current?.abort();
      const abortController = new AbortController();
      generationAbortRef.current = abortController;
      const abortSignal = abortController.signal;
      try {
        let payload: Record<string, unknown>;
        let sourceInputForLog: string | null = null;

        let generationTab: ActionTab = ctx.actionTab;
        let videoModel = composerModelId;
        let directorRoute: DirectorRouteResult | null = null;

        if (ctx.actionTab === "AI Director") {
          directorRoute = resolveDirectorRoute({
            style: directorStyle,
            prompt: promptValue,
            hasStartImage: Boolean(ctx.promptImageUrl),
            qualityPreset: directorQualityPreset,
            forceModelId: directorForceModelIdRef.current
          });
          setDirectorLastRoute(directorRoute);
          setComposerModelId(directorRoute.modelId);
          generationTab = directorRoute.actionTab;
          videoModel = directorRoute.modelId;
        }

        if (!isAtlasVideoComposerId(videoModel)) {
          setGenerateError("AI Director could not pick a supported model.");
          return;
        }

        const motionPromptOptional =
          generationTab === "Video to Video" &&
          videoToVideoTabUsesDualAssetPipeline(videoModel);
        if (!promptForAtlas && motionPromptOptional) {
          promptForAtlas = resolveMotionControlAtlasPrompt("");
        }

        const aspectRatio =
          ctx.actionTab === "AI Director"
            ? ctx.aspectRatio.trim() || directorAspectRatio
            : ctx.aspectRatio.trim() || aspect.trim();
        const resTier =
          ctx.actionTab === "AI Director"
            ? (directorRoute?.resolution ?? (ctx.resolution.trim() || "720p"))
            : ctx.actionTab === "Audio to Video"
              ? normalizeAudioToVideoResolution(ctx.resolution.trim() || resolution.trim())
              : ctx.resolution.trim() || resolution.trim();
        const duration =
          ctx.actionTab === "AI Director"
            ? normalizeDirectorDurationSeconds(
                videoModel,
                directorRoute?.routeAction ?? "text",
                ctx.durationSeconds
              )
            : ctx.durationSeconds;

        const supportsNativeAudio =
          videoComposerSupportsGenerateAudio(videoModel) &&
          (generationTab === "Text to Video" ||
            generationTab === "Image to Video" ||
            generationTab === "Reference to Video" ||
            (generationTab === "Video to Video" && videoToVideoTabUsesViduStartEnd(videoModel)));

        const wantGenerateAudio = supportsNativeAudio && ctx.generateAudio;

        setActiveGenMeta({
          modelId: videoModel,
          isDirector: ctx.actionTab === "AI Director",
          actionTab: ctx.actionTab,
          directorStyle: directorRoute?.styleResolved,
          directorQualityPreset: directorRoute?.qualityPreset,
          generateAudioOn: wantGenerateAudio,
          isUpscale: false
        });

        const speed_tier = ctx.speedTier;

        const veoT2vI2vSettings =
          isVeo31ComposerId(videoModel) &&
          (generationTab === "Text to Video" || generationTab === "Image to Video")
            ? normalizeVeo31ComposerSettings({
                timeSeconds: duration,
                aspect: aspectRatio,
                resolution: resTier,
                actionTab: generationTab
              })
            : null;
        const hailuoSettings = isHailuo23ComposerId(videoModel)
          ? {
              timeSeconds:
                generationTab === "Image to Video"
                  ? normalizeHailuo23I2vDurationSeconds(duration)
                  : HAILUO_23_T2V_DURATION_SECONDS
            }
          : null;
        const atlasAspect = veoT2vI2vSettings?.aspect ?? aspectRatio;
        const atlasResolution = veoT2vI2vSettings?.resolution ?? resTier;
        const atlasDuration =
          hailuoSettings?.timeSeconds ?? veoT2vI2vSettings?.timeSeconds ?? duration;

        const wan26ShotPayload =
          isWan26ComposerId(videoModel) &&
          (generationTab === "Text to Video" ||
            generationTab === "Image to Video" ||
            generationTab === "Video to Video")
            ? { shot_type: ctx.wan26ShotType }
            : {};

        const klingV3ShotPayload =
          videoModel === KLING_30_PRO_MODEL_ID &&
          (generationTab === "Text to Video" || generationTab === "Image to Video")
            ? { kling_v3_shot_mode: ctx.klingV3ShotMode }
            : {};

        const atlasAspectForPayload =
          videoModel === KLING_30_PRO_MODEL_ID &&
          (generationTab === "Text to Video" || generationTab === "Image to Video")
            ? klingV3AspectFromUi(aspectRatio)
            : atlasAspect;
        const atlasDurationForPayload =
          generationTab === "Video to Video" && videoToVideoTabUsesKlingMotion(videoModel)
            ? KLING_MOTION_CREDIT_ESTIMATE_SECONDS
            : videoModel === KLING_30_PRO_MODEL_ID &&
              (generationTab === "Text to Video" || generationTab === "Image to Video")
              ? normalizeKlingV3DurationSeconds(duration)
              : atlasDuration;

        switch (generationTab) {
          case "Text to Video":
            payload = {
              prompt: promptForAtlas,
              action: "text",
              videoModel,
              ...(isHailuo23ComposerId(videoModel)
                ? { duration: atlasDurationForPayload }
                : {
                    aspectRatio: atlasAspectForPayload,
                    ...(videoModel === KLING_30_PRO_MODEL_ID
                      ? {}
                      : { resolution: atlasResolution }),
                    duration: atlasDurationForPayload
                  }),
              speed_tier,
              ...wan26ShotPayload,
              ...klingV3ShotPayload,
              ...(supportsNativeAudio ? { generate_audio: wantGenerateAudio } : {})
            };
            break;
          case "Image to Video": {
            const geminiImages: string[] = [];
            if (videoModel === GEMINI_OMNI_FLASH_I2V_COMPOSER_ID) {
              for (let i = 0; i < ctx.referenceImageUrls.length; i++) {
                const raw = ctx.referenceImageUrls[i];
                if (!raw) continue;
                const u = await ensureAtlasPublicHttpsMediaUrl(raw);
                if (!u) {
                  setGenerateError(`Could not upload reference image ${i + 1}. Try again.`);
                  return;
                }
                geminiImages.push(u);
              }
              if (geminiImages.length < 1) {
                setGenerateError("Add at least one reference image for Gemini Omni Flash.");
                return;
              }
            }
            const image_url =
              videoModel === GEMINI_OMNI_FLASH_I2V_COMPOSER_ID
                ? null
                : await ensureAtlasPublicHttpsMediaUrl(ctx.promptImageUrl);
            if (!image_url && videoModel !== GEMINI_OMNI_FLASH_I2V_COMPOSER_ID) {
              setGenerateError("Add a Start frame image for Image to Video.");
              return;
            }
            const last_image_url = videoComposerSupportsEndFrame(videoModel)
              ? await ensureAtlasPublicHttpsMediaUrl(ctx.promptImage2Url)
              : null;
            sourceInputForLog = image_url ?? geminiImages[0] ?? null;
            payload = {
              prompt: promptForAtlas,
              action: "image",
              videoModel,
              ...(image_url ? { image_url } : {}),
              ...(geminiImages.length > 0 ? { reference_images: geminiImages } : {}),
              ...(last_image_url ? { last_image_url } : {}),
              ...(isHailuo23ComposerId(videoModel)
                ? { duration: atlasDurationForPayload }
                : {
                    ...(videoModel === KLING_30_PRO_MODEL_ID
                      ? { aspectRatio: atlasAspectForPayload }
                      : { aspectRatio: atlasAspectForPayload, resolution: atlasResolution }),
                    duration: atlasDurationForPayload
                  }),
              speed_tier,
              ...wan26ShotPayload,
              ...klingV3ShotPayload,
              ...(supportsNativeAudio ? { generate_audio: wantGenerateAudio } : {})
            };
            break;
          }
          case "Reference to Video": {
            if (!videoComposerSupportsReferenceToVideo(videoModel)) {
              setGenerateError(
                "Reference to Video requires Seedance 2.0, Gemini Omni Flash R2V, Grok Imagine Video R2V, Vidu Q3, HappyHorse 1.0, Wan 2.7, or Veo 3.1."
              );
              return;
            }
            const reference_images: string[] = [];
            for (let i = 0; i < ctx.referenceImageUrls.length; i++) {
              const raw = ctx.referenceImageUrls[i];
              if (!raw) continue;
              const u = await ensureAtlasPublicHttpsMediaUrl(raw);
              if (!u) {
                setGenerateError(`Could not upload reference image ${i + 1}. Try again.`);
                return;
              }
              reference_images.push(u);
            }
            const reference_videos: string[] = [];
            const reference_audios: string[] = [];
            if (
              videoModel === "seedance-2" ||
              isWan27ComposerId(videoModel) ||
              videoModel === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID
            ) {
              for (let i = 0; i < ctx.referenceVideoUrls.length; i++) {
                const raw = ctx.referenceVideoUrls[i];
                if (!raw) continue;
                const u = await ensureAtlasPublicHttpsMediaUrl(raw);
                if (!u) {
                  setGenerateError(`Could not upload reference video ${i + 1}. Try again.`);
                  return;
                }
                reference_videos.push(u);
              }
              for (let i = 0; i < ctx.referenceAudioUrls.length; i++) {
                const raw = ctx.referenceAudioUrls[i];
                if (!raw) continue;
                const u = await ensureAtlasPublicHttpsMediaUrl(raw);
                if (!u) {
                  setGenerateError(
                    isWan27ComposerId(videoModel)
                      ? `Could not upload voice reference. Try again.`
                      : `Could not upload reference audio ${i + 1}. Try again.`
                  );
                  return;
                }
                reference_audios.push(u);
              }
              if (reference_images.length < 1 && reference_videos.length < 1) {
                setGenerateError(
                  videoModel === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID
                    ? "Add at least one reference image and one source video for Gemini Omni Flash."
                    : isWan27ComposerId(videoModel)
                    ? "Add at least one reference image or video (Wan 2.7)."
                    : "Add at least one reference image or reference video (Seedance 2.0)."
                );
                return;
              }
              if (
                videoModel === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID &&
                (reference_images.length < 1 || reference_videos.length < 1)
              ) {
                setGenerateError("Add at least one reference image and one source video for Gemini Omni Flash.");
                return;
              }
            } else if (reference_images.length < 1) {
              setGenerateError("Add at least one reference image for Reference to Video.");
              return;
            }
            if (videoModel === "seedance-2") {
              promptForAtlas = ensureSeedanceReferenceTokensInPrompt(promptForAtlas, {
                imageCount: reference_images.length,
                videoCount: reference_videos.length,
                audioCount: reference_audios.length
              });
            }
            sourceInputForLog = reference_images[0] ?? reference_videos[0] ?? null;
            const refDuration =
              videoModel === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID
                ? normalizeGrokImagineVideoReferenceDurationSeconds(duration)
                : videoModel === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID
                  ? normalizeGeminiOmniFlashReferenceDurationSeconds(duration)
                : isVeo31ComposerId(videoModel)
                  ? normalizeVeo31ReferenceDurationSeconds(duration)
                  : isWan27ComposerId(videoModel)
                    ? normalizeWan27ReferenceDurationSeconds(duration)
                    : normalizeSeedanceReferenceDurationSeconds(duration);
            payload = {
              prompt: promptForAtlas,
              action: "reference",
              videoModel,
              reference_images,
              ...((videoModel === "seedance-2" ||
                isWan27ComposerId(videoModel) ||
                videoModel === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID) &&
              reference_videos.length > 0
                ? { reference_videos }
                : {}),
              ...((videoModel === "seedance-2" || isWan27ComposerId(videoModel)) &&
              reference_audios.length > 0
                ? { reference_audios }
                : {}),
              aspectRatio,
              resolution: resTier,
              duration: refDuration,
              speed_tier,
              ...(supportsNativeAudio ? { generate_audio: wantGenerateAudio } : {})
            };
            break;
          }
          case "Video to Video": {
            if (videoToVideoTabUsesDualAssetPipeline(videoModel)) {
              const image_url = await ensureAtlasPublicHttpsMediaUrl(ctx.promptImageUrl);
              const video_url = await ensureAtlasPublicHttpsMediaUrl(ctx.motionVideoUrl);
              if (!image_url) {
                setGenerateError(
                  videoToVideoTabUsesWanCharacterSwap(videoModel)
                    ? "Add a character portrait for Wan 2.2 Character Swap."
                    : "Add a character image (Kling 2.6 Motion)."
                );
                return;
              }
              if (!video_url) {
                setGenerateError(
                  videoToVideoTabUsesWanCharacterSwap(videoModel)
                    ? "Add a source video for Wan 2.2 Character Swap."
                    : "Add a motion reference clip (Kling 2.6 Motion)."
                );
                return;
              }
              sourceInputForLog = image_url;
              if (videoToVideoTabUsesKlingMotion(videoModel)) {
                payload = {
                  prompt: promptForAtlas || resolveMotionControlAtlasPrompt(""),
                  action: "motion-control",
                  videoModel,
                  image_url,
                  video_url,
                  character_orientation: ctx.characterOrientation,
                  keep_original_sound: ctx.keepOriginalSound,
                  speed_tier
                };
              } else {
                payload = {
                  prompt: promptForAtlas || resolveMotionControlAtlasPrompt(""),
                  action: "motion-control",
                  videoModel,
                  image_url,
                  video_url,
                  speed_tier
                };
              }
              break;
            }
            if (videoToVideoTabUsesViduStartEnd(videoModel)) {
              const image_url = await ensureAtlasPublicHttpsMediaUrl(ctx.promptImageUrl);
              const end_image_url = await ensureAtlasPublicHttpsMediaUrl(ctx.promptImage2Url);
              if (!image_url) {
                setGenerateError("Add a start frame image for Vidu Start-End.");
                return;
              }
              if (!end_image_url) {
                setGenerateError("Add an end frame image for Vidu Start-End.");
                return;
              }
              sourceInputForLog = image_url;
              payload = {
                prompt: promptForAtlas,
                action: "start-end",
                videoModel,
                image_url,
                last_image_url: end_image_url,
                aspectRatio,
                resolution: resTier,
                duration,
                speed_tier,
                ...(supportsNativeAudio ? { generate_audio: wantGenerateAudio } : {})
              };
              break;
            }
            const video_url = await ensureAtlasPublicHttpsMediaUrl(ctx.editSourceVideoUrl);
            if (!video_url) {
              setGenerateError("Add a source video for Video to Video.");
              return;
            }
            if (
              !videoComposerSupportsVideoEditTab(videoModel) &&
              !videoToVideoTabUsesDualAssetPipeline(videoModel)
            ) {
              setGenerateError(
                "Video to Video requires Wan 2.6/2.7, HappyHorse 1.0, Vidu Q3-Pro, Kling 2.6 Motion, or Wan 2.2 Character Swap."
              );
              return;
            }
            sourceInputForLog = video_url;
            const v2vReferenceImages: string[] = [];
            if (
              isHappyHorseComposerId(videoModel) ||
              isWan27ComposerId(videoModel)
            ) {
              for (let i = 0; i < ctx.referenceImageUrls.length; i++) {
                const raw = ctx.referenceImageUrls[i];
                if (!raw) continue;
                const u = await ensureAtlasPublicHttpsMediaUrl(raw);
                if (u) v2vReferenceImages.push(u);
              }
            }
            payload = {
              prompt: promptForAtlas,
              action: "edit",
              videoModel,
              video_url,
              aspectRatio,
              resolution: resTier,
              duration,
              speed_tier,
              ...wan26ShotPayload,
              ...(v2vReferenceImages.length > 0
                ? { reference_images: v2vReferenceImages }
                : {})
            };
            break;
          }
          case "Audio to Video": {
            const image_url = await ensureAtlasPublicHttpsMediaUrl(ctx.promptImageUrl);
            if (!image_url) {
              setGenerateError("Add a portrait image for Audio to Video.");
              return;
            }
            const audio_url = await ensureAtlasPublicHttpsMediaUrl(ctx.lipsyncAudioUrl);
            if (!audio_url) {
              setGenerateError("Add an audio file for Audio to Video.");
              return;
            }
            if (!isAudioToVideoComposerId(videoModel)) {
              setGenerateError("Select InfiniteTalk or VEED Fabric for Audio to Video.");
              return;
            }
            sourceInputForLog = image_url;
            payload = {
              prompt: promptForAtlas,
              action: "lipsync",
              videoModel,
              image_url,
              audio_url,
              aspectRatio,
              resolution: resTier,
              duration,
              speed_tier
            };
            break;
          }
          default:
            payload = {
              prompt: promptForAtlas,
              action: "text",
              videoModel,
              aspectRatio,
              resolution: resTier,
              duration,
              speed_tier
            };
        }

        console.log("[VideoGenerationPage] POST /api/generate-video body", payload, {
          aspectRatio,
          resTier,
          wantGenerateAudio,
          speed_tier
        });
        console.log(
          "[VideoGenerationPage] prompt sent to Atlas (stripped):",
          JSON.stringify(promptForAtlas),
          "| UI prompt:",
          JSON.stringify(promptValue)
        );

        const requiredCredits = creditsChargedForVideoModel(videoModel, {
          durationSeconds: atlasDurationForPayload,
          resolution: atlasResolution,
          speedTier: videoComposerSupportsSpeedTier(videoModel) ? speed_tier : "standard",
          generateAudio: wantGenerateAudio,
          routeAction: videoPricingRouteAction(generationTab)
        });
        if (shouldBlockForInsufficientCredits(credits, requiredCredits, "video")) {
          setInsufficientCredits({ open: true, required: requiredCredits, balance: credits });
          return;
        }

        trackFirstGenerationStarted("video");

        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortSignal
        });

        let data: {
          video_url?: string;
          videoUrl?: string;
          pending?: boolean;
          prediction_id?: string;
          predictionId?: string;
          poll_interval_ms?: number;
          credits_spent?: number;
          credits_balance?: number;
          credits_required?: number;
          error?: string;
          atlas_request?: {
            width?: number;
            height?: number;
            aspect_ratio?: string;
            generate_audio?: boolean;
          };
        } = {};
        try {
          data = (await res.json()) as typeof data;
        } catch {
          setGenerateError(`Generation failed (${res.status})`);
          return;
        }

        if (!res.ok) {
          if (res.status === 401) {
            setAuthRequiredOpen(true);
            setGenerateError(GENERATION_AUTH_MESSAGE);
            return;
          }
          if (res.status === 402) {
            setGenerateError(insufficientCreditsMessage(data));
            return;
          }
          setGenerateError(
            formatAtlasVideoFailureForUi(data.error, {
              generateAudio: wantGenerateAudio,
              hostIsProduction:
                typeof window !== "undefined" && !window.location.hostname.includes("localhost"),
              action: atlasPollActionForTab(generationTab)
            }) || `Generation failed (${res.status})`
          );
          return;
        }

        const creditsSpent = data.credits_spent ?? 0;
        if (directorRoute) {
          setDirectorLastCreditsSpent(creditsSpent);
        }
        void refreshCredits();

        if (data.atlas_request) {
          console.log("[VideoGenerationPage] Atlas request echoed from server", data.atlas_request);
        }

        let finalVideoUrl: string | null = null;
        let predictionIdForLog: string | null = null;

        const syncUrl = pickVideoUrlFromPollBody(data as Record<string, unknown>);
        if (syncUrl) {
          const rawOut = syncUrl;
          finalVideoUrl = normalizeAtlasVideoUrlForPlayback(rawOut);
          console.log("[VideoGenerationPage] Atlas video URL â†’ player (sync response)", {
            rawLength: rawOut.length,
            resolvedLength: finalVideoUrl.length,
            looksLikeMp4Path: videoUrlLooksLikeMp4Path(finalVideoUrl),
            redirectNormalized: rawOut !== finalVideoUrl,
            resolved: finalVideoUrl
          });
          setVideoDownloadUrl(finalVideoUrl);
          setVideoUrl(toBrowserVideoSrc(finalVideoUrl));
        } else if (pickPredictionIdFromPost(data) && data.pending !== false) {
          const predictionId = pickPredictionIdFromPost(data);
          if (!predictionId) {
            setGenerateError("No video URL or job id was returned.");
            return;
          }
          predictionIdForLog = predictionId;
          const interval = data.poll_interval_ms ?? ATLAS_CLIENT_POLL_MS;
          const deadline = Date.now() + ATLAS_CLIENT_MAX_WAIT_MS;
          while (Date.now() < deadline) {
            if (abortSignal.aborted) return;
            await new Promise((r) => setTimeout(r, interval));
            if (abortSignal.aborted) return;
            const pollQs = new URLSearchParams({ predictionId });
            if (wantGenerateAudio) pollQs.set("generate_audio", "1");
            const pollAction = atlasPollActionForTab(generationTab);
            if (pollAction !== "text") pollQs.set("action", pollAction);
            const pr = await fetch(`/api/generate-video?${pollQs.toString()}`, {
              cache: "no-store",
              signal: abortSignal
            });
            let pd: {
              video_url?: string | null;
              videoUrl?: string | null;
              outputs?: unknown;
              output?: unknown;
              status?: string;
              error?: string | null;
              atlas_error?: string | null;
              prediction_id?: string;
              poll_interval_ms?: number;
            } = {};
            try {
              pd = (await pr.json()) as typeof pd;
            } catch {
              setGenerateError(`Status check failed (${pr.status})`);
              return;
            }
            if (!pr.ok) {
              setGenerateError(pd.error ?? `Status check failed (${pr.status})`);
              return;
            }
            const polledUrl = pickVideoUrlFromPollBody(pd as Record<string, unknown>);
            const statusNorm = (pd.status ?? "").toLowerCase();

            if (polledUrl && isAtlasVideoTerminalSuccessStatus(pd.status)) {
              const rawOut = polledUrl;
              finalVideoUrl = normalizeAtlasVideoUrlForPlayback(rawOut);
              console.log("[VideoGenerationPage] Atlas video URL â†’ player (after poll)", {
                status: pd.status,
                terminalOk: isAtlasVideoTerminalSuccessStatus(pd.status),
                rawLength: rawOut.length,
                resolvedLength: finalVideoUrl.length,
                looksLikeMp4Path: videoUrlLooksLikeMp4Path(finalVideoUrl),
                redirectNormalized: rawOut !== finalVideoUrl,
                resolved: finalVideoUrl
              });
              setVideoDownloadUrl(finalVideoUrl);
              setVideoUrl(toBrowserVideoSrc(finalVideoUrl));
              break;
            }
            if (statusNorm === "failed") {
              const rawErr = pd.atlas_error ?? pd.error ?? null;
              const pollId = pd.prediction_id ?? predictionId;
              if (process.env.NODE_ENV === "development") {
                console.warn("[VideoGenerationPage] Atlas poll failed", {
                  status: pd.status,
                  atlas_error: rawErr,
                  prediction_id: pollId
                });
              }
              const msg = formatAtlasVideoFailureForUi(rawErr, {
                generateAudio: wantGenerateAudio,
                hostIsProduction:
                  typeof window !== "undefined" && !window.location.hostname.includes("localhost"),
                action: atlasPollActionForTab(generationTab)
              });
              setGenerateError(
                pollId && !isAtlasRealPersonImageError(rawErr)
                  ? `${msg}\n\n(prediction: ${pollId.slice(0, 12)}…)`
                  : msg
              );
              return;
            }
            if (isAtlasVideoTerminalSuccessStatus(pd.status) && !polledUrl) {
              setGenerateError("Generation finished but no video URL was returned.");
              return;
            }
          }
          if (!finalVideoUrl) {
            setGenerateError("Video generation timed out. Check your connection and try again.");
            return;
          }
        } else {
          setGenerateError("No video URL or job id was returned.");
          return;
        }

        const id = `v-${Date.now()}`;
        const displayTitle =
          stripVideoComposerAssetTokens(promptValue).slice(0, 48) || videoModel;
        const thumbForHistory =
          (generationTab === "Image to Video" ||
            generationTab === "Reference to Video" ||
            generationTab === "Audio to Video" ||
            ctx.actionTab === "AI Director" ||
            (generationTab === "Video to Video" &&
              videoToVideoTabUsesDualAssetPipeline(videoModel))) &&
          sourceInputForLog
            ? sourceInputForLog
            : `https://picsum.photos/seed/${id.slice(-6)}/96/96`;

        const settingsSnapshot: VideoHistorySettingsSnapshot = {
          actionTab: ctx.actionTab,
          composerModelId: videoModel,
          modeValue,
          durationStandard: videoComposerSupportsSpeedTier(videoModel)
            ? durationStandard
            : "Standard",
          timeSeconds: duration,
          aspect: aspectRatio,
          resolution: resTier,
          generateAudioOn: wantGenerateAudio,
          promptRaw: promptValue,
          promptImageUrl:
            (ctx.actionTab === "Image to Video" ||
              (ctx.actionTab === "Video to Video" &&
                videoToVideoTabUsesDualAssetPipeline(videoModel))) &&
            sourceInputForLog
              ? sourceInputForLog
              : ctx.promptImageUrl,
          promptImage2Url: ctx.promptImage2Url,
          lipsyncAudioUrl:
            ctx.actionTab === "Audio to Video" && sourceInputForLog ? sourceInputForLog : ctx.lipsyncAudioUrl,
          editSourceVideoUrl:
            ctx.actionTab === "Video to Video" &&
            sourceInputForLog &&
            !videoToVideoTabUsesDualAssetPipeline(videoModel)
              ? sourceInputForLog
              : ctx.editSourceVideoUrl,
          motionVideoUrl: ctx.motionVideoUrl,
          characterOrientation: ctx.characterOrientation,
          keepOriginalSound: ctx.keepOriginalSound,
          referenceImageUrls:
            ctx.actionTab === "Reference to Video" ||
            (ctx.actionTab === "Video to Video" && isHappyHorseComposerId(videoModel))
              ? [...ctx.referenceImageUrls]
              : undefined,
          referenceVideoUrls:
            ctx.actionTab === "Reference to Video" && videoModel === "seedance-2"
              ? [...ctx.referenceVideoUrls]
              : undefined,
          referenceAudioUrls:
            ctx.actionTab === "Reference to Video" && videoModel === "seedance-2"
              ? [...ctx.referenceAudioUrls]
              : undefined
        };

        setHistory((prev) => [
          {
            id,
            thumb: thumbForHistory,
            title: displayTitle,
            outputVideoUrl: finalVideoUrl,
            settingsSnapshot
          },
          ...prev.filter((h) => h.outputVideoUrl !== finalVideoUrl)
        ]);
        setHasUserGenerated(true);
        trackFirstGenerationCompleted("video");

        logAtlasComposerVideoToSupabase({
          output_url: finalVideoUrl,
          input_url: sourceInputForLog ?? "",
          prediction_id: predictionIdForLog,
          video_model: videoModel,
          credits_spent: creditsSpent
        }).then((generationId) => {
          pendingMirrorGenerationIdRef.current = generationId;
        });

        if (directorRoute) {
          void logDirectorRunToApi({
            style_requested: directorRoute.styleRequested,
            style_resolved: directorRoute.styleResolved,
            routed_model: directorRoute.modelId,
            route_action: directorRoute.routeAction,
            prompt: promptValue,
            success: true,
            prediction_id: predictionIdForLog,
            output_url: finalVideoUrl,
            credits_spent: creditsSpent
          }).then((runId) => {
            directorRunIdRef.current = runId;
          });
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
        if (!generationUserCancelledRef.current) {
          setGenerateError(humanizeClientFetchError(e));
        }
      } finally {
        generationAbortRef.current = null;
        setLoading(false);
      }
    },
    [
      aspect,
      credits,
      composerModelId,
      directorQualityPreset,
      directorDurationSec,
      directorSoundtrackOn,
      directorStyle,
      durationStandard,
      loading,
      modeValue,
      prompt,
      refreshCredits,
      resolution,
      timeSeconds
    ]
  );

  const outputVideoSourceUrl = useMemo(() => {
    if (showingModelShowcase) return null;
    return (
      videoDownloadUrl?.trim() ||
      (videoUrl ? extractCanonicalVideoUrlFromProxy(videoUrl) : null) ||
      (videoUrl?.startsWith("https://") ? videoUrl : null) ||
      null
    );
  }, [showingModelShowcase, videoDownloadUrl, videoUrl]);

  const canPostProcessVideo = Boolean(outputVideoSourceUrl);

  const resetDirectorTabDefaults = useCallback(() => {
    setGenerateError(null);
    setPrompt("");
    setPromptImageUrlSafe(null);
    setDirectorStyle("auto");
    setDirectorQualityPreset("balanced");
    setDirectorSoundtrackOn(true);
    setDirectorDurationSec(DIRECTOR_LAUNCH_DEFAULT_DURATION_SEC);
    setDirectorAspectRatio(DIRECTOR_LAUNCH_DEFAULT_ASPECT);
    setDirectorActiveExampleId(null);
    setDirectorForceModelId(null);
    directorForceModelIdRef.current = null;
    directorAutoResolvedStyleRef.current = null;
    setDirectorLastRoute(null);
    setDirectorLastCreditsSpent(0);
    setDirectorSlowBannerDismissed(false);
    appliedShowcaseForModel.current = null;
  }, [setPromptImageUrlSafe]);

  const resetComposerTabDefaults = useCallback(
    (tab: ActionTab) => {
      setGenerateError(null);
      setPrompt("");
      setPromptImageUrlSafe(null);
      setPromptImage2UrlSafe(null);
      setLipsyncAudioUrlSafe(null);
      setEditSourceVideoUrlSafe(null);
      setMotionVideoUrlSafe(null);
      setCharacterOrientation("image");
      setKeepOriginalSound(true);
      setWan26ShotType("single");
      setKlingV3ShotMode("single");
      setModeValue("UGC");
      setDurationStandard("Standard");

      const models = bottomBarModelsForActionTab(tab);
      const defaultModel =
        tab === "Audio to Video"
          ? INFINITETALK_COMPOSER_ID
          : tab === "Video to Video"
            ? "wan-2-6"
            : (models[0]?.id ?? "seedance-2");

      setComposerModelId(defaultModel);
      setGenerateAudioOn(isWan27ComposerId(defaultModel));
      setAspect("9:16");
      setResolution(
        tab === "Audio to Video"
          ? DEFAULT_AUDIO_TO_VIDEO_RESOLUTION
          : "1080p"
      );
      setTimeSeconds(
        isHailuo23ComposerId(defaultModel) && tab === "Text to Video"
          ? HAILUO_23_T2V_DURATION_SECONDS
          : 10
      );

      setReferenceImageUrls(
        Array.from({ length: referenceToVideoMaxImages(defaultModel) }, () => null)
      );
      setReferenceVideoUrls(
        Array.from({ length: SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS }, () => null)
      );
      setReferenceAudioUrls(
        Array.from({ length: SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS }, () => null)
      );

      appliedShowcaseForModel.current = null;
      applyModelShowcase(defaultModel, tab);
    },
    [
      applyModelShowcase,
      setEditSourceVideoUrlSafe,
      setLipsyncAudioUrlSafe,
      setMotionVideoUrlSafe,
      setPromptImage2UrlSafe,
      setPromptImageUrlSafe
    ]
  );

  const resetCurrentTabDefaults = useCallback(() => {
    if (actionTab === "AI Director") {
      resetDirectorTabDefaults();
    } else {
      resetComposerTabDefaults(actionTab);
    }
  }, [actionTab, resetComposerTabDefaults, resetDirectorTabDefaults]);

  const handleExtendVideo = useCallback(async () => {
    if (!outputVideoSourceUrl) {
      setGenerateError("Generate a video first, then extend it.");
      return;
    }
    const httpsUrl = await ensureAtlasPublicHttpsMediaUrl(outputVideoSourceUrl);
    if (!httpsUrl) {
      setGenerateError(
        "Could not prepare your video for extend. Try downloading and re-uploading in Video to Video."
      );
      return;
    }
    setGenerateError(null);
    setEditSourceVideoUrlSafe(httpsUrl);
    setPrompt((current) => {
      const base = current.trim();
      const suffix =
        "Continue the scene seamlessly with natural motion, same style, camera movement, and lighting.";
      return base ? `${base}\n\n${suffix}` : suffix;
    });
    const baseDuration =
      actionTab === "AI Director" ? directorDurationSec : timeSeconds;
    setTimeSeconds(Math.min(15, Math.max(10, baseDuration + 5)));
    setComposerModelId("wan-2-7");
    setResolution("720p");
    appliedShowcaseForModel.current = null;
    setActionTab("Video to Video");
  }, [
    actionTab,
    directorDurationSec,
    outputVideoSourceUrl,
    setEditSourceVideoUrlSafe,
    timeSeconds
  ]);

  const runVideoUpscale = useCallback(async () => {
    if (loading || !outputVideoSourceUrl) {
      setGenerateError("Generate a video first, then upscale it.");
      return;
    }
    const httpsUrl = await ensureAtlasPublicHttpsMediaUrl(outputVideoSourceUrl);
    if (!httpsUrl) {
      setGenerateError(
        "Could not prepare your video for upscale. Try again after the clip finishes processing."
      );
      return;
    }

    const durationSeconds =
      actionTab === "AI Director" ? directorDurationSec : timeSeconds;
    const currentRes =
      actionTab === "AI Director"
        ? (directorPreviewRoute?.resolution ?? "720p")
        : resolution;
    const targetResolution = normalizeAtlasVideoUpscalerTarget(
      currentRes === "1080p" || currentRes === "4k" ? "2k" : "1080p"
    );

    setGenerateError(null);
    setVideoUrl(null);
    setVideoDownloadUrl(null);
    setLoading(true);
    setActiveGenMeta({
      modelId: ATLAS_VIDEO_UPSCALER_COMPOSER_ID,
      isDirector: false,
      actionTab,
      isUpscale: true
    });
    generationUserCancelledRef.current = false;
    generationAbortRef.current?.abort();
    const abortController = new AbortController();
    generationAbortRef.current = abortController;
    const abortSignal = abortController.signal;

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upscale",
          video_url: httpsUrl,
          duration: durationSeconds,
          target_resolution: targetResolution,
          videoModel: ATLAS_VIDEO_UPSCALER_COMPOSER_ID
        }),
        signal: abortSignal
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        if (res.status === 401) {
          setAuthRequiredOpen(true);
          setGenerateError(GENERATION_AUTH_MESSAGE);
          return;
        }
        if (res.status === 402) {
          setGenerateError(insufficientCreditsMessage(data as Parameters<typeof insufficientCreditsMessage>[0]));
          return;
        }
        setGenerateError(
          formatAtlasVideoFailureForUi(String(data.error ?? ""), {
            generateAudio: false,
            hostIsProduction:
              typeof window !== "undefined" && !window.location.hostname.includes("localhost")
          }) || `Upscale failed (${res.status})`
        );
        return;
      }

      void refreshCredits();

      let finalVideoUrl: string | null = pickVideoUrlFromPollBody(data);
      if (finalVideoUrl) {
        finalVideoUrl = normalizeAtlasVideoUrlForPlayback(finalVideoUrl);
        setVideoDownloadUrl(finalVideoUrl);
        setVideoUrl(toBrowserVideoSrc(finalVideoUrl));
        setHasUserGenerated(true);
        setResolution("1080p");
        return;
      }

      const predictionId = pickPredictionIdFromPost(data as { prediction_id?: string; id?: string });
      if (!predictionId || data.pending === false) {
        setGenerateError("Upscale did not return a job id.");
        return;
      }

      const interval = (data.poll_interval_ms as number | undefined) ?? ATLAS_CLIENT_POLL_MS;
      const deadline = Date.now() + ATLAS_CLIENT_MAX_WAIT_MS;
      while (Date.now() < deadline) {
        if (abortSignal.aborted) return;
        await new Promise((r) => setTimeout(r, interval));
        if (abortSignal.aborted) return;
        const pollQs = new URLSearchParams({ predictionId });
        pollQs.set("action", "edit");
        const pr = await fetch(`/api/generate-video?${pollQs.toString()}`, {
          cache: "no-store",
          signal: abortSignal
        });
        let pd: Record<string, unknown> = {};
        try {
          pd = (await pr.json()) as Record<string, unknown>;
        } catch {
          setGenerateError(`Upscale status check failed (${pr.status})`);
          return;
        }
        const polledUrl = pickVideoUrlFromPollBody(pd);
        const pollStatus = typeof pd.status === "string" ? pd.status : "";
        if (polledUrl && isAtlasVideoTerminalSuccessStatus(pollStatus)) {
          const normalized = normalizeAtlasVideoUrlForPlayback(polledUrl);
          setVideoDownloadUrl(normalized);
          setVideoUrl(toBrowserVideoSrc(normalized));
          setHasUserGenerated(true);
          setResolution("1080p");
          void refreshCredits();
          return;
        }
        const status = pollStatus.toLowerCase();
        if (status === "failed") {
          setGenerateError(
            formatAtlasVideoFailureForUi(String(pd.error ?? pd.atlas_error ?? ""), {
              generateAudio: false,
              hostIsProduction:
                typeof window !== "undefined" && !window.location.hostname.includes("localhost")
            }) || "Video upscale failed."
          );
          return;
        }
        if (isAtlasVideoTerminalSuccessStatus(pollStatus) && !polledUrl) {
          setGenerateError("Upscale finished but no video URL was returned.");
          return;
        }
      }
      setGenerateError("Upscale is taking longer than expected. Check History in a few minutes.");
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setGenerateError(e instanceof Error ? e.message : "Upscale network error.");
    } finally {
      generationAbortRef.current = null;
      setLoading(false);
    }
  }, [
    actionTab,
    directorDurationSec,
    directorPreviewRoute?.resolution,
    loading,
    outputVideoSourceUrl,
    refreshCredits,
    resolution,
    timeSeconds
  ]);

  const buildDirectorGenerateContext = useCallback(
    (): VideoGenerateContext => ({
      promptText: prompt,
      actionTab: "AI Director",
      aspectRatio: directorAspectRatio,
      resolution: directorPreviewRoute?.resolution ?? "720p",
      durationSeconds: directorDurationSec,
      promptImageUrl,
      promptImage2Url: null,
      lipsyncAudioUrl: null,
      editSourceVideoUrl: null,
      motionVideoUrl: null,
      characterOrientation: "image",
      keepOriginalSound: true,
      referenceImageUrls: [],
      referenceVideoUrls: [],
      referenceAudioUrls: [],
      generateAudio: directorSoundtrackOn,
      speedTier: directorPreviewRoute
        ? videoComposerSupportsSpeedTier(directorPreviewRoute.modelId)
          ? directorSpeedTierForQualityPreset(directorQualityPreset)
          : "standard"
        : "standard",
      wan26ShotType: "single",
      klingV3ShotMode: "single"
    }),
    [
      prompt,
      promptImageUrl,
      directorSoundtrackOn,
      directorPreviewRoute,
      directorQualityPreset,
      directorDurationSec,
      directorAspectRatio,
    ]
  );

  const handleDirectorExampleSelect = useCallback((example: DirectorExample) => {
    setGenerateError(null);
    setDirectorForceModelId(null);
    directorForceModelIdRef.current = null;
    setDirectorActiveExampleId(example.id);
    setDirectorStyle(example.style);
    setDirectorSoundtrackOn(true);
    setDirectorQualityPreset("balanced");
    setDirectorDurationSec(
      example.defaultDurationSec ?? directorDefaultDurationForStyle(example.style)
    );
    setDirectorAspectRatio(directorDefaultAspectForStyle(example.style));
    setPrompt(example.prompt);
  }, []);

  const handleDirectorRegenerate = useCallback(() => {
    const modelId = directorLastRoute?.modelId ?? null;
    setDirectorForceModelId(modelId);
    directorForceModelIdRef.current = modelId;
    void runGeneration(buildDirectorGenerateContext());
  }, [buildDirectorGenerateContext, directorLastRoute, runGeneration]);

  const handleDirectorTryAnother = useCallback(() => {
    if (!directorLastRoute) return;
    const nextModel = getNextDirectorModelInChain(
      directorLastRoute.modelId,
      directorLastRoute.modelChain
    );
    if (!nextModel) return;
    setDirectorForceModelId(nextModel);
    directorForceModelIdRef.current = nextModel;
    void runGeneration(buildDirectorGenerateContext());
  }, [buildDirectorGenerateContext, directorLastRoute, runGeneration]);

  const handleCancelGeneration = useCallback(() => {
    generationUserCancelledRef.current = true;
    setGenerateError(VIDEO_GENERATION_CANCEL_MESSAGE);
    generationAbortRef.current?.abort();
  }, []);

  const handleVideoPlaybackConfirmed = useCallback(() => {
    const generationId = pendingMirrorGenerationIdRef.current;
    if (!generationId) return;
    pendingMirrorGenerationIdRef.current = null;
    void fetch("/api/generations/mirror-atlas-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ generation_id: generationId })
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { output_url?: string };
        const mirrored = data.output_url?.trim();
        if (mirrored?.startsWith("https://")) {
          setVideoDownloadUrl(mirrored);
          setVideoUrl(toBrowserVideoSrc(mirrored));
        }
      })
      .catch(() => {});
  }, []);

  const handleDirectorSlowTryAnother = useCallback(() => {
    if (!directorLastRoute) return;
    const nextModel = getNextDirectorModelInChain(
      directorLastRoute.modelId,
      directorLastRoute.modelChain
    );
    if (!nextModel) return;
    generationUserCancelledRef.current = true;
    setGenerateError(null);
    generationAbortRef.current?.abort();
    setDirectorForceModelId(nextModel);
    directorForceModelIdRef.current = nextModel;
    window.setTimeout(() => {
      void runGeneration(buildDirectorGenerateContext());
    }, 100);
  }, [buildDirectorGenerateContext, directorLastRoute, runGeneration]);

  const restoreSettings = useCallback(
    (item: VideoHistoryEntry) => {
      if (item.id.startsWith("showcase-")) {
        setGenerateError(null);
        setVideoUrl(null);
        setVideoDownloadUrl(null);
        setHasUserGenerated(false);
        appliedShowcaseForModel.current = null;
        applyModelShowcase(composerModelId, actionTab);
        return;
      }
      const snap = item.settingsSnapshot;
      if (snap) {
        setGenerateError(null);
        setPrompt(snap.promptRaw);
        setModeValue(snap.modeValue);
        setComposerModelId(snap.composerModelId);
        setDurationStandard(
          videoComposerSupportsSpeedTier(snap.composerModelId) ? snap.durationStandard : "Standard"
        );
        setTimeSeconds(snap.timeSeconds);
        setAspect(snap.aspect);
        setResolution(snap.resolution);
        setGenerateAudioOn(
          videoComposerSupportsGenerateAudio(snap.composerModelId) ? snap.generateAudioOn : false
        );
        if (snap.composerModelId === KLING_30_PRO_MODEL_ID) {
          setActionTab("Text to Video");
        } else if (
          (snap.actionTab as string) === "Character Swap" ||
          (snap.actionTab as string) === "Motion Control"
        ) {
          setActionTab("Video to Video");
        } else {
          setActionTab(snap.actionTab);
        }
        setPromptImageUrlSafe(snap.promptImageUrl);
        setPromptImage2UrlSafe(snap.promptImage2Url);
        setLipsyncAudioUrlSafe(snap.lipsyncAudioUrl);
        setEditSourceVideoUrlSafe(snap.editSourceVideoUrl);
        if (snap.referenceImageUrls?.length) {
          const modelId = snap.composerModelId ?? composerModelId;
          const tab = (snap.actionTab as ActionTab) ?? actionTab;
          const max = wan27VideoEditSupportsReferenceImages(modelId, tab)
            ? wan27VideoEditMaxImages()
            : happyHorseVideoEditSupportsReferenceImages(modelId, tab)
              ? happyHorseVideoEditMaxImages()
              : referenceToVideoMaxImages(modelId);
          const padded = Array.from({ length: max }, (_, i) => snap.referenceImageUrls?.[i] ?? null);
          setReferenceImageUrls(padded);
        } else {
          const modelId = snap.composerModelId ?? composerModelId;
          const tab = (snap.actionTab as ActionTab) ?? actionTab;
          const max = wan27VideoEditSupportsReferenceImages(modelId, tab)
            ? wan27VideoEditMaxImages()
            : happyHorseVideoEditSupportsReferenceImages(modelId, tab)
              ? happyHorseVideoEditMaxImages()
              : referenceToVideoMaxImages(modelId);
          setReferenceImageUrls(Array.from({ length: max }, () => null));
        }
        const videoSlotMax = isWan27ComposerId(snap.composerModelId)
          ? WAN_27_REFERENCE_MAX_VIDEOS
          : SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS;
        if (snap.referenceVideoUrls?.length) {
          const padded = Array.from(
            { length: videoSlotMax },
            (_, i) => snap.referenceVideoUrls?.[i] ?? null
          );
          setReferenceVideoUrls(padded);
        } else {
          setReferenceVideoUrls(Array.from({ length: videoSlotMax }, () => null));
        }
        const audioSlotMax = isWan27ComposerId(snap.composerModelId)
          ? WAN_27_REFERENCE_MAX_VOICE_AUDIOS
          : SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS;
        if (snap.referenceAudioUrls?.length) {
          const padded = Array.from(
            { length: audioSlotMax },
            (_, i) => snap.referenceAudioUrls?.[i] ?? null
          );
          setReferenceAudioUrls(padded);
        } else {
          setReferenceAudioUrls(Array.from({ length: audioSlotMax }, () => null));
        }
      } else if (item.title) {
        setPrompt((p) => `${p.split("\n")[0]}\n(Restored: ${item.title})`);
      }

      if (item.outputVideoUrl) {
        setGenerateError(null);
        const raw = item.outputVideoUrl;
        const resolved = normalizeAtlasVideoUrlForPlayback(raw);
        console.log("[VideoGenerationPage] restore history â†’ player", {
          rawLength: raw.length,
          resolvedLength: resolved.length,
          looksLikeMp4Path: videoUrlLooksLikeMp4Path(resolved),
          resolved
        });
        setVideoDownloadUrl(resolved);
        setVideoUrl(toBrowserVideoSrc(resolved));
      }
    },
    [
      actionTab,
      applyModelShowcase,
      composerModelId,
      setEditSourceVideoUrlSafe,
      setMotionVideoUrlSafe,
      setLipsyncAudioUrlSafe,
      setPromptImage2UrlSafe,
      setPromptImageUrlSafe
    ]
  );

  const hidePromptThumb =
    actionTab === "AI Director"
      ? Boolean(promptImageUrl)
      : actionTab === "Audio to Video"
        ? true
        : videoComposerUsesTextOnlyLayout(composerModelId, actionTab) ||
          actionTab === "Reference to Video" ||
          Boolean(inputPreviewVideoUrl);

  const previewComposerModelId =
    directorLastRoute?.modelId ?? (actionTab === "AI Director" ? directorPreviewRoute?.modelId : null) ?? composerModelId;

  const directorCanTryAnother =
    directorLastRoute != null &&
    getNextDirectorModelInChain(directorLastRoute.modelId, directorLastRoute.modelChain) != null;

  const directorResultPanel =
    actionTab === "AI Director" &&
    directorLastRoute &&
    videoUrl &&
    !showingModelShowcase
      ? {
          modelLabel: composerModelDisplayLabel(directorLastRoute.modelId, "video"),
          styleLabel: directorStyleLabel(directorLastRoute.styleResolved),
          creditsSpent: directorLastCreditsSpent,
          canTryAnother: directorCanTryAnother,
          onRegenerate: handleDirectorRegenerate,
          onTryAnother: handleDirectorTryAnother
        }
      : null;

  const generationProgressPanel =
    loading
      ? {
          modelLabel: composerModelDisplayLabel(
            activeGenMeta?.modelId ?? previewComposerModelId,
            "video"
          ),
          composerModelId: activeGenMeta?.modelId ?? previewComposerModelId,
          elapsedSec: directorGenElapsedSec,
          directorRouted: activeGenMeta?.isDirector ?? actionTab === "AI Director",
          tip: videoGenerationContextTip({
            actionTab: activeGenMeta?.actionTab ?? actionTab,
            directorStyle: activeGenMeta?.directorStyle ?? directorStyle,
            directorQualityPreset:
              activeGenMeta?.directorQualityPreset ?? directorQualityPreset,
            generateAudioOn: activeGenMeta?.generateAudioOn ?? generateAudioOn,
            isUpscale: activeGenMeta?.isUpscale
          }),
          showSlowBanner:
            (activeGenMeta?.isDirector ?? actionTab === "AI Director") &&
            directorGenElapsedSec >= VIDEO_SLOW_GENERATION_SEC &&
            !directorSlowBannerDismissed,
          canTryAnother: directorCanTryAnother,
          onCancel: handleCancelGeneration,
          onKeepWaiting: () => setDirectorSlowBannerDismissed(true),
          onTryAnother: handleDirectorSlowTryAnother
        }
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-zorixa-bg">
      <Navbar fixed />

      <div
        className="box-border flex min-h-0 flex-1 flex-col px-4 pt-0 max-lg:px-3"
        style={{
          marginTop: studioNavOffset,
          paddingBottom: bottomBarHeight
        }}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col gap-4 overflow-x-hidden font-body lg:flex-row lg:items-stretch lg:gap-5 max-lg:gap-2">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-0">
            <VideoPreview
              actionTab={actionTab}
              composerModelId={previewComposerModelId}
              videoUrl={previewVideoUrl}
              videoDownloadUrl={showingModelShowcase ? previewVideoUrl : videoDownloadUrl}
              loading={loading}
              errorMessage={generateError}
              isExample={showingModelShowcase}
              posterUrl={
                showingModelShowcase && modelShowcase
                  ? showcaseVideoAssetUrl(modelShowcase.posterUrl)
                  : null
              }
              directorResult={directorResultPanel}
              directorResultLoading={loading}
              generationProgress={generationProgressPanel}
              promptThumbUrl={hidePromptThumb ? null : promptImageUrl}
              bottomBarHeight={bottomBarHeight}
              aspectRatio={actionTab === "AI Director" ? directorAspectRatio : aspect}
              canPostProcessVideo={canPostProcessVideo}
              postProcessBusy={loading}
              onResetDefaults={resetCurrentTabDefaults}
              onExtendVideo={() => void handleExtendVideo()}
              onUpscaleVideo={() => void runVideoUpscale()}
              allowVideoDownload={Boolean(outputVideoSourceUrl) || showingModelShowcase}
              onPlaybackConfirmed={handleVideoPlaybackConfirmed}
              className="scrollbar-hide h-full min-h-0 w-full min-w-0 flex-1"
            />
          </div>

          <VideoHistory
            items={historyItems}
            onSelect={restoreSettings}
            scrollPaddingBottom={0}
            className="hidden h-auto max-h-[min(42vh,380px)] min-h-0 w-full shrink-0 lg:block lg:h-full lg:max-h-none lg:w-[300px] lg:min-w-[300px] lg:max-w-[300px]"
          />
        </div>
      </div>

      {actionTab === "AI Director" ? (
        <AiDirectorBottomBar
          prompt={prompt}
          onPromptChange={(v) => {
            setGenerateError(null);
            setDirectorForceModelId(null);
            setDirectorActiveExampleId(null);
            setPrompt(v);
          }}
          actionTab={actionTab}
          onActionTabChange={handleActionTabChange}
          promptImageUrl={promptImageUrl}
          onPromptImageChange={(url) => {
            setDirectorForceModelId(null);
            setPromptImageUrlSafe(url);
          }}
          directorStyle={directorStyle}
          onDirectorStyleChange={(style) => {
            setDirectorForceModelId(null);
            setDirectorStyle(style);
            if (style === "auto") {
              directorAutoResolvedStyleRef.current = null;
            } else {
              setDirectorDurationSec(directorDefaultDurationForStyle(style));
              setDirectorAspectRatio(directorDefaultAspectForStyle(style));
            }
          }}
          qualityPreset={directorQualityPreset}
          onQualityPresetChange={(preset) => {
            setDirectorForceModelId(null);
            setDirectorQualityPreset(preset);
          }}
          modelLabel={
            directorPreviewRoute
              ? composerModelDisplayLabel(directorPreviewRoute.modelId, "video")
              : null
          }
          modelSummary={directorPreviewRoute?.modelSummary ?? null}
          whyBullets={directorPreviewRoute?.whyBullets ?? []}
          estimatedCredits={directorEstimatedCredits}
          routedModelId={directorPreviewRoute?.modelId ?? null}
          directorResolution={directorPreviewRoute?.resolution ?? "720p"}
          durationSec={directorDurationSec}
          durationOptions={directorDurationOptions}
          onDurationChange={setDirectorDurationSec}
          aspectRatio={directorAspectRatio}
          aspectOptions={directorAspectOptions}
          onAspectChange={setDirectorAspectRatio}
          soundtrackOn={directorSoundtrackOn}
          onSoundtrackChange={setDirectorSoundtrackOn}
          directorExamples={directorExamples}
          activeExampleId={directorActiveExampleId}
          onExampleSelect={handleDirectorExampleSelect}
          loadingGenerate={loading}
          onGenerate={(ctx) => {
            setDirectorForceModelId(null);
            directorForceModelIdRef.current = null;
            void runGeneration(ctx);
          }}
          onHeightChange={handleBottomBarHeight}
        />
      ) : (
      <VideoBottomBar
        prompt={prompt}
        onPromptChange={(v) => {
          setGenerateError(null);
          setPrompt(v);
        }}
        actionTab={actionTab}
        onActionTabChange={handleActionTabChange}
        promptImageUrl={promptImageUrl}
        onPromptImageChange={setPromptImageUrlSafe}
        promptImage2Url={promptImage2Url}
        onPromptImage2Change={setPromptImage2UrlSafe}
        lipsyncAudioUrl={lipsyncAudioUrl}
        onLipsyncAudioUrlChange={setLipsyncAudioUrlSafe}
        editSourceVideoUrl={editSourceVideoUrl}
        onEditSourceVideoUrlChange={setEditSourceVideoUrlSafe}
        motionVideoUrl={motionVideoUrl}
        onMotionVideoUrlChange={setMotionVideoUrlSafe}
        characterOrientation={characterOrientation}
        onCharacterOrientationChange={setCharacterOrientation}
        keepOriginalSound={keepOriginalSound}
        onKeepOriginalSoundChange={setKeepOriginalSound}
        referenceImageUrls={referenceImageUrls}
        onReferenceImageChange={setReferenceImageAt}
        referenceVideoUrls={referenceVideoUrls}
        onReferenceVideoChange={setReferenceVideoAt}
        referenceAudioUrls={referenceAudioUrls}
        onReferenceAudioChange={setReferenceAudioAt}
        composerModelId={composerModelId}
        onComposerModelChange={handleComposerModelChange}
        generateAudioOn={generateAudioOn}
        onGenerateAudioChange={setGenerateAudioOn}
        modeValue={modeValue}
        onModeChange={setModeValue}
        durationStandard={durationStandard}
        onDurationStandardChange={setDurationStandard}
        timeSeconds={timeSeconds}
        onTimeSecondsChange={setTimeSeconds}
        aspect={aspect}
        onAspectChange={setAspect}
        resolution={resolution}
        onResolutionChange={setResolution}
        wan26ShotType={wan26ShotType}
        onWan26ShotTypeChange={setWan26ShotType}
        klingV3ShotMode={klingV3ShotMode}
        onKlingV3ShotModeChange={setKlingV3ShotMode}
        creditsLine={creditsLine}
        loadingGenerate={loading}
        onGenerate={runGeneration}
        onHeightChange={handleBottomBarHeight}
      />
      )}
      <InsufficientCreditsModal
        open={insufficientCredits.open}
        required={insufficientCredits.required}
        balance={insufficientCredits.balance}
        onClose={() => setInsufficientCredits(CLOSED_INSUFFICIENT_CREDITS)}
      />
      <AuthRequiredModal open={authRequiredOpen} onClose={() => setAuthRequiredOpen(false)} />
    </div>
  );
}
