"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Navbar } from "@/components/layout/Navbar";

import type { ActionTab } from "@/components/video/ActionTabsRow";
import type { VideoGenerateContext } from "@/components/video/VideoBottomBar";
import type { KlingMotionCharacterOrientation } from "@/lib/atlas-kling-motion-control";
import {
  KLING_26_MOTION_COMPOSER_ID,
  KLING_30_PRO_MODEL_ID,
  REFERENCE_TO_VIDEO_MAX_IMAGES,
  videoComposerSupportsEndFrame,
  videoComposerSupportsReferenceToVideo,
  characterSwapTabSupportsModel,
  videoComposerSupportsVideoEditTab,
  characterSwapTabUsesDualAssetPipeline,
  videoToVideoTabUsesKlingMotion,
  videoToVideoTabUsesWanCharacterSwap,
  videoToVideoTabUsesViduStartEnd,
  videoComposerUsesTextOnlyLayout
} from "@/components/video/bottom-bar-models";
import { normalizeSeedanceReferenceDurationSeconds } from "@/lib/atlas-seedance-reference-video";
import {
  normalizeViduDurationSeconds,
  VIDU_Q3_COMPOSER_ID,
  VIDU_Q3_PRO_COMPOSER_ID
} from "@/lib/atlas-vidu-video";
import type { VideoHistoryEntry, VideoHistorySettingsSnapshot } from "@/components/video/VideoHistory";
import {
  isAtlasVideoComposerId,
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
import { isWan27ComposerId, normalizeWan27DurationSeconds } from "@/lib/atlas-wan-27-video";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  extractAtlasVideoOutputUrl,
  type AtlasLikeVideoPayload
} from "@/lib/extract-atlas-video-output-url";
import { normalizeAtlasVideoUrlForPlayback, videoUrlLooksLikeMp4Path } from "@/lib/resolve-video-playback-url";
import {
  formatAtlasVideoFailureForUi,
  isAtlasRealPersonImageError
} from "@/lib/atlas-video-failure-message";
import { resolveVideoStudioFromQuery } from "@/lib/studio-catalog-link";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";
import { buildSameOriginVideoPlaybackUrl } from "@/lib/video-playback-proxy";
import { VideoBottomBar } from "@/components/video/VideoBottomBar";
import { VideoHistory } from "@/components/video/VideoHistory";
import { VideoPreview } from "@/components/video/VideoPreview";

const NAV_H = 56;

const ATLAS_CLIENT_POLL_MS = 3000;
const ATLAS_CLIENT_MAX_WAIT_MS = 15 * 60 * 1000;

function atlasTerminalSuccessStatus(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "succeeded" || s === "completed";
}

function atlasPollActionForTab(
  tab: ActionTab
): "text" | "image" | "reference" {
  if (tab === "Image to Video") return "image";
  if (tab === "Reference to Video") return "reference";
  return "text";
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

/** Same-origin playback URL (cookie session) â†’ 302 to CDN; falls back to raw if host not allowlisted. */
function toBrowserVideoSrc(canonicalHttps: string): string {
  if (typeof window === "undefined") return canonicalHttps;
  return buildSameOriginVideoPlaybackUrl(canonicalHttps, window.location.origin);
}

function extensionForUploadedBlob(blob: Blob): string {
  const mt = (blob.type || "").toLowerCase();
  if (mt.includes("jpeg") || mt === "image/jpg") return "jpg";
  if (mt === "image/png") return "png";
  if (mt === "image/webp") return "webp";
  if (mt === "image/gif") return "gif";
  if (mt.startsWith("audio/")) return "mp3";
  if (mt.startsWith("video/")) return "mp4";
  return "png";
}

/**
 * Atlas `generateVideo` needs a public https:// URL in `image` / media fields.
 * Resolves blob: and data: sources via `/api/upload`, upgrades httpâ†’https.
 */
async function ensureAtlasPublicHttpsMediaUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  const t = url.trim();
  const direct = coerceToPublicHttpsUrl(t);
  if (direct) return direct;

  if (!t.startsWith("blob:") && !t.startsWith("data:")) return null;

  const blobRes = await fetch(t);
  const blob = await blobRes.blob();
  const ext = extensionForUploadedBlob(blob);
  const file = new File([blob], `upload.${ext}`, {
    type: blob.type || "application/octet-stream"
  });
  const form = new FormData();
  form.set("file", file);
  const up = await fetch("/api/upload", {
    method: "POST",
    body: form,
    credentials: "include"
  });
  if (!up.ok) {
    let msg = "Upload failed â€” sign in and try again.";
    try {
      const j = (await up.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await up.json()) as { url: string };
  const out = coerceToPublicHttpsUrl(data.url);
  if (!out) {
    throw new Error("Upload did not return a usable https URL.");
  }
  return out;
}

function logAtlasComposerVideoToSupabase(payload: {
  output_url: string;
  input_url?: string;
  prediction_id?: string | null;
  video_model?: string | null;
}) {
  void fetch("/api/generations/atlas-video-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      output_url: payload.output_url,
      input_url: payload.input_url ?? "",
      prediction_id: payload.prediction_id ?? null,
      video_model: payload.video_model ?? null
    })
  }).catch(() => {});
}

export function VideoGenerationPage() {
  const searchParams = useSearchParams();
  const [bottomBarHeight, setBottomBarHeight] = useState(130);

  const [modeValue, setModeValue] = useState("UGC");

  const [composerModelId, setComposerModelId] = useState("seedance-2");
  const [generateAudioOn, setGenerateAudioOn] = useState(false);
  const [durationStandard, setDurationStandard] = useState("Standard");
  const [timeSeconds, setTimeSeconds] = useState(10);
  const [aspect, setAspect] = useState("9:16");
  const [resolution, setResolution] = useState("1080p");
  const [actionTab, setActionTab] = useState<ActionTab>("Image to Video");
  const [prompt, setPrompt] = useState("");

  const [promptImageUrl, setPromptImageUrl] = useState<string | null>(null);
  const [promptImage2Url, setPromptImage2Url] = useState<string | null>(null);
  const [lipsyncAudioUrl, setLipsyncAudioUrl] = useState<string | null>(null);
  const [editSourceVideoUrl, setEditSourceVideoUrl] = useState<string | null>(null);
  const [motionVideoUrl, setMotionVideoUrl] = useState<string | null>(null);
  const [characterOrientation, setCharacterOrientation] =
    useState<KlingMotionCharacterOrientation>("image");
  const [keepOriginalSound, setKeepOriginalSound] = useState(true);
  const [referenceImageUrls, setReferenceImageUrls] = useState<(string | null)[]>(() =>
    Array.from({ length: REFERENCE_TO_VIDEO_MAX_IMAGES }, () => null)
  );

  const setReferenceImageAt = useCallback((index: number, url: string | null) => {
    setReferenceImageUrls((prev) => {
      const next = [...prev];
      const old = next[index];
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      next[index] = url;
      return next;
    });
  }, []);

  const setPromptImageUrlSafe = useCallback((url: string | null) => {
    setPromptImageUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const setPromptImage2UrlSafe = useCallback((url: string | null) => {
    setPromptImage2Url((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const setLipsyncAudioUrlSafe = useCallback((url: string | null) => {
    setLipsyncAudioUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const setEditSourceVideoUrlSafe = useCallback((url: string | null) => {
    setEditSourceVideoUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const setMotionVideoUrlSafe = useCallback((url: string | null) => {
    setMotionVideoUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  /** Raw Atlas/CDN URL for full-file download (playback uses proxied `videoUrl`). */
  const [videoDownloadUrl, setVideoDownloadUrl] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [history, setHistory] = useState<VideoHistoryEntry[]>([]);

  const creditsLine = "428 CR/s";

  const handleBottomBarHeight = useCallback((height: number) => {
    setBottomBarHeight(height);
  }, []);

  const handleComposerModelChange = useCallback((id: string) => {
    setComposerModelId(id);
    setGenerateError(null);
    if (!videoComposerSupportsGenerateAudio(id)) {
      setGenerateAudioOn(false);
    }
    if (!videoComposerSupportsSpeedTier(id)) {
      setDurationStandard("Standard");
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
    if (isWan27ComposerId(id)) {
      setTimeSeconds((t) => normalizeWan27DurationSeconds(t));
      if (resolution === "480p") setResolution("720p");
      const wanAspects = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;
      if (!wanAspects.includes(aspect as (typeof wanAspects)[number])) {
        setAspect("16:9");
      }
    }
    if (id === KLING_30_PRO_MODEL_ID) {
      setActionTab("Text to Video");
    }
    if (actionTab === "Reference to Video") {
      if (id === VIDU_Q3_PRO_COMPOSER_ID) {
        setComposerModelId(VIDU_Q3_COMPOSER_ID);
      } else if (!videoComposerSupportsReferenceToVideo(id)) {
        setActionTab("Image to Video");
      }
    }
    if (actionTab === "Character Swap" && !characterSwapTabSupportsModel(id)) {
      setActionTab("Image to Video");
    }
    if (
      actionTab === "Video to Video" &&
      !videoComposerSupportsVideoEditTab(id) &&
      !videoToVideoTabUsesViduStartEnd(id)
    ) {
      setActionTab("Image to Video");
    }
  }, [actionTab]);

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
    if (actionTab === "Character Swap" && !characterSwapTabSupportsModel(composerModelId)) {
      setComposerModelId(KLING_26_MOTION_COMPOSER_ID);
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
  }, [searchParams]);

  const handleActionTabChange = useCallback((tab: ActionTab) => {
    setActionTab(tab);
    setGenerateError(null);
    if (tab === "Reference to Video") {
      setComposerModelId("seedance-2");
      setTimeSeconds((t) => normalizeSeedanceReferenceDurationSeconds(t));
    }
    if (tab === "Video to Video") {
      setComposerModelId("wan-2-6");
    }
    if (tab === "Audio to Video") {
      setComposerModelId(INFINITETALK_COMPOSER_ID);
      setResolution((r) =>
        isAudioToVideoResolution(r) ? r : DEFAULT_AUDIO_TO_VIDEO_RESOLUTION
      );
    }
  }, []);

  const runGeneration = useCallback(
    async (ctx: VideoGenerateContext) => {
      if (loading) return;

      setGenerateError(null);
      setVideoUrl(null);
      setVideoDownloadUrl(null);

      // Merge context + React state: avoids empty prompt when Generate runs before the last onChange commits.
      const promptValue = ctx.promptText.trim() || prompt.trim();
      const promptForAtlas = stripVideoComposerAssetTokens(promptValue);

      if (!isAtlasVideoComposerId(composerModelId)) {
        setGenerateError("Unsupported video model.");
        return;
      }

      if (!promptValue) {
        setGenerateError("Enter a prompt to generate a video.");
        return;
      }

      if (!promptForAtlas) {
        setGenerateError("Enter a prompt (not only image placeholders) to generate a video.");
        return;
      }

      setLoading(true);
      try {
        let payload: Record<string, unknown>;
        let sourceInputForLog: string | null = null;

        const aspectRatio = ctx.aspectRatio.trim() || aspect.trim();
        const resTier =
          ctx.actionTab === "Audio to Video"
            ? normalizeAudioToVideoResolution(ctx.resolution.trim() || resolution.trim())
            : ctx.resolution.trim() || resolution.trim();
        const videoModel = composerModelId;
        const duration = ctx.durationSeconds;

        const wantGenerateAudio =
          ctx.generateAudio &&
          videoComposerSupportsGenerateAudio(videoModel) &&
          (ctx.actionTab === "Text to Video" ||
            ctx.actionTab === "Image to Video" ||
            ctx.actionTab === "Reference to Video" ||
            (ctx.actionTab === "Video to Video" && videoToVideoTabUsesViduStartEnd(videoModel)));

        const speed_tier = ctx.speedTier;

        switch (ctx.actionTab) {
          case "Text to Video":
            payload = {
              prompt: promptForAtlas,
              action: "text",
              videoModel,
              aspectRatio,
              resolution: resTier,
              duration,
              speed_tier,
              ...(wantGenerateAudio ? { generate_audio: true } : {})
            };
            break;
          case "Image to Video": {
            const image_url = await ensureAtlasPublicHttpsMediaUrl(ctx.promptImageUrl);
            if (!image_url) {
              setGenerateError("Add a Start frame image for Image to Video.");
              return;
            }
            const last_image_url = videoComposerSupportsEndFrame(videoModel)
              ? await ensureAtlasPublicHttpsMediaUrl(ctx.promptImage2Url)
              : null;
            sourceInputForLog = image_url;
            payload = {
              prompt: promptForAtlas,
              action: "image",
              videoModel,
              image_url,
              ...(last_image_url ? { last_image_url } : {}),
              aspectRatio,
              resolution: resTier,
              duration,
              speed_tier,
              ...(wantGenerateAudio ? { generate_audio: true } : {})
            };
            break;
          }
          case "Reference to Video": {
            if (!videoComposerSupportsReferenceToVideo(videoModel)) {
              setGenerateError(
                "Reference to Video requires Seedance 2.0, Vidu Q3, HappyHorse 1.0, or Wan 2.7."
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
            if (reference_images.length < 1) {
              setGenerateError("Add at least one reference image for Reference to Video.");
              return;
            }
            sourceInputForLog = reference_images[0] ?? null;
            const refDuration = normalizeSeedanceReferenceDurationSeconds(duration);
            payload = {
              prompt: promptForAtlas,
              action: "reference",
              videoModel,
              reference_images,
              aspectRatio,
              resolution: resTier,
              duration: refDuration,
              speed_tier,
              ...(wantGenerateAudio ? { generate_audio: true } : {})
            };
            break;
          }
          case "Character Swap": {
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
            if (!characterSwapTabSupportsModel(videoModel)) {
              setGenerateError("Select Kling 2.6 Motion or Wan 2.2 Character Swap.");
              return;
            }
            sourceInputForLog = image_url;
            if (videoToVideoTabUsesKlingMotion(videoModel)) {
              payload = {
                prompt: promptForAtlas,
                action: "motion-control",
                videoModel,
                image_url,
                video_url,
                character_orientation: ctx.characterOrientation,
                keep_original_sound: ctx.keepOriginalSound,
                duration,
                speed_tier
              };
            } else {
              payload = {
                prompt: promptForAtlas,
                action: "motion-control",
                videoModel,
                image_url,
                video_url,
                speed_tier
              };
            }
            break;
          }
          case "Video to Video": {
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
                ...(wantGenerateAudio ? { generate_audio: true } : {})
              };
              break;
            }
            const video_url = await ensureAtlasPublicHttpsMediaUrl(ctx.editSourceVideoUrl);
            if (!video_url) {
              setGenerateError("Add a source video for Video to Video.");
              return;
            }
            if (!videoComposerSupportsVideoEditTab(videoModel)) {
              setGenerateError(
                "Video to Video requires Wan 2.6/2.7, HappyHorse 1.0, or Vidu Q3-Pro."
              );
              return;
            }
            sourceInputForLog = video_url;
            payload = {
              prompt: promptForAtlas,
              action: "edit",
              videoModel,
              video_url,
              aspectRatio,
              resolution: resTier,
              duration,
              speed_tier
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
            sourceInputForLog = audio_url;
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

        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        let data: {
          video_url?: string;
          videoUrl?: string;
          pending?: boolean;
          prediction_id?: string;
          predictionId?: string;
          poll_interval_ms?: number;
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
          setGenerateError(
            formatAtlasVideoFailureForUi(data.error, {
              generateAudio: wantGenerateAudio,
              hostIsProduction:
                typeof window !== "undefined" && !window.location.hostname.includes("localhost"),
              action: atlasPollActionForTab(ctx.actionTab)
            }) || `Generation failed (${res.status})`
          );
          return;
        }

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
            await new Promise((r) => setTimeout(r, interval));
            const pollQs = new URLSearchParams({ predictionId });
            if (wantGenerateAudio) pollQs.set("generate_audio", "1");
            const pollAction = atlasPollActionForTab(ctx.actionTab);
            if (pollAction !== "text") pollQs.set("action", pollAction);
            const pr = await fetch(`/api/generate-video?${pollQs.toString()}`, {
              cache: "no-store"
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

            if (polledUrl) {
              const rawOut = polledUrl;
              finalVideoUrl = normalizeAtlasVideoUrlForPlayback(rawOut);
              console.log("[VideoGenerationPage] Atlas video URL â†’ player (after poll)", {
                status: pd.status,
                terminalOk: atlasTerminalSuccessStatus(pd.status),
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
              console.error("[VideoGenerationPage] Atlas poll failed", {
                status: pd.status,
                atlas_error: pd.atlas_error,
                error: pd.error,
                prediction_id: pd.prediction_id ?? predictionId
              });
              const msg = formatAtlasVideoFailureForUi(pd.atlas_error ?? pd.error, {
                generateAudio: wantGenerateAudio,
                hostIsProduction:
                  typeof window !== "undefined" && !window.location.hostname.includes("localhost"),
                action: atlasPollActionForTab(ctx.actionTab)
              });
              setGenerateError(
                pd.prediction_id && !isAtlasRealPersonImageError(pd.atlas_error ?? pd.error)
                  ? `${msg}\n\n(prediction: ${pd.prediction_id.slice(0, 12)}â€¦)`
                  : msg
              );
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
          (ctx.actionTab === "Image to Video" ||
            ctx.actionTab === "Reference to Video" ||
            (ctx.actionTab === "Character Swap" &&
              characterSwapTabUsesDualAssetPipeline(videoModel))) &&
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
              (ctx.actionTab === "Character Swap" &&
                characterSwapTabUsesDualAssetPipeline(videoModel))) &&
            sourceInputForLog
              ? sourceInputForLog
              : ctx.promptImageUrl,
          promptImage2Url: ctx.promptImage2Url,
          lipsyncAudioUrl:
            ctx.actionTab === "Audio to Video" && sourceInputForLog ? sourceInputForLog : ctx.lipsyncAudioUrl,
          editSourceVideoUrl:
            ctx.actionTab === "Video to Video" && sourceInputForLog
              ? sourceInputForLog
              : ctx.editSourceVideoUrl,
          motionVideoUrl: ctx.motionVideoUrl,
          characterOrientation: ctx.characterOrientation,
          keepOriginalSound: ctx.keepOriginalSound,
          referenceImageUrls:
            ctx.actionTab === "Reference to Video" ? [...ctx.referenceImageUrls] : undefined
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

        logAtlasComposerVideoToSupabase({
          output_url: finalVideoUrl,
          input_url: sourceInputForLog ?? "",
          prediction_id: predictionIdForLog,
          video_model: composerModelId
        });
      } catch (e: unknown) {
        setGenerateError(e instanceof Error ? e.message : "Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [aspect, composerModelId, durationStandard, loading, modeValue, prompt, resolution, timeSeconds]
  );

  const restoreSettings = useCallback(
    (item: VideoHistoryEntry) => {
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
        } else if ((snap.actionTab as string) === "Motion Control") {
          setActionTab("Character Swap");
        } else {
          setActionTab(snap.actionTab);
        }
        setPromptImageUrlSafe(snap.promptImageUrl);
        setPromptImage2UrlSafe(snap.promptImage2Url);
        setLipsyncAudioUrlSafe(snap.lipsyncAudioUrl);
        setEditSourceVideoUrlSafe(snap.editSourceVideoUrl);
        if (snap.referenceImageUrls?.length) {
          const padded = Array.from({ length: REFERENCE_TO_VIDEO_MAX_IMAGES }, (_, i) =>
            snap.referenceImageUrls?.[i] ?? null
          );
          setReferenceImageUrls(padded);
        } else {
          setReferenceImageUrls(
            Array.from({ length: REFERENCE_TO_VIDEO_MAX_IMAGES }, () => null)
          );
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
      setEditSourceVideoUrlSafe,
      setMotionVideoUrlSafe,
      setLipsyncAudioUrlSafe,
      setPromptImage2UrlSafe,
      setPromptImageUrlSafe
    ]
  );

  const hidePromptThumb =
    actionTab === "Audio to Video"
      ? false
      : videoComposerUsesTextOnlyLayout(composerModelId, actionTab) ||
        actionTab === "Reference to Video";

  return (
    <div className="flex min-h-dvh flex-col bg-zorixa-bg">
      <Navbar fixed />

      <div
        className="box-border flex min-h-0 flex-1 flex-col px-4 pt-0"
        style={{
          marginTop: NAV_H,
          paddingBottom: bottomBarHeight
        }}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col gap-4 overflow-x-hidden font-body lg:flex-row lg:items-stretch lg:gap-5">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-0">
            <VideoPreview
              actionTab={actionTab}
              onActionTabChange={handleActionTabChange}
              composerModelId={composerModelId}
              videoUrl={videoUrl}
              videoDownloadUrl={videoDownloadUrl}
              loading={loading}
              errorMessage={generateError}
              promptThumbUrl={hidePromptThumb ? null : promptImageUrl}
              bottomBarHeight={bottomBarHeight}
              aspectRatio={aspect}
              className="scrollbar-hide h-full min-h-0 w-full min-w-0 flex-1"
            />
          </div>

          <VideoHistory
            items={history}
            onSelect={restoreSettings}
            scrollPaddingBottom={0}
            className="h-auto max-h-[min(42vh,380px)] min-h-0 w-full shrink-0 lg:h-full lg:max-h-none lg:w-[300px] lg:min-w-[300px] lg:max-w-[300px]"
          />
        </div>
      </div>

      <VideoBottomBar
        prompt={prompt}
        onPromptChange={(v) => {
          setGenerateError(null);
          setPrompt(v);
        }}
        actionTab={actionTab}
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
        creditsLine={creditsLine}
        loadingGenerate={loading}
        onGenerate={runGeneration}
        onHeightChange={handleBottomBarHeight}
      />
    </div>
  );
}
