"use client";

import { useCallback, useState } from "react";

import { Navbar } from "@/components/layout/Navbar";

import type { ActionTab } from "@/components/video/ActionTabsRow";
import type { VideoGenerateContext } from "@/components/video/VideoBottomBar";
import { KLING_30_PRO_MODEL_ID } from "@/components/video/bottom-bar-models";
import type { VideoHistoryEntry, VideoHistorySettingsSnapshot } from "@/components/video/VideoHistory";
import {
  isAtlasVideoComposerId,
  videoComposerSupportsSpeedTier
} from "@/lib/atlas-video-model-ids";
import { videoComposerSupportsGenerateAudio } from "@/lib/atlas-video-generate-audio";
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
 * Resolves blob: and data: sources via `/api/upload`, upgrades http→https.
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
    let msg = "Upload failed — sign in and try again.";
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
    if (id === KLING_30_PRO_MODEL_ID) {
      setActionTab("Text to Video");
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
        const resTier = ctx.resolution.trim() || resolution.trim();
        const videoModel = composerModelId;
        const duration = ctx.durationSeconds;

        const wantGenerateAudio =
          ctx.generateAudio &&
          videoComposerSupportsGenerateAudio(videoModel) &&
          (ctx.actionTab === "Text to Video" || ctx.actionTab === "Image to Video");

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
              setGenerateError("Add a Products image for Image to Video.");
              return;
            }
            sourceInputForLog = image_url;
            payload = {
              prompt: promptForAtlas,
              action: "image",
              videoModel,
              image_url,
              aspectRatio,
              resolution: resTier,
              duration,
              speed_tier,
              ...(wantGenerateAudio ? { generate_audio: true } : {})
            };
            break;
          }
          case "Lipsyncing": {
            const audio_url = await ensureAtlasPublicHttpsMediaUrl(ctx.lipsyncAudioUrl);
            if (!audio_url) {
              setGenerateError("Add an audio file for Lipsyncing.");
              return;
            }
            sourceInputForLog = audio_url;
            payload = {
              prompt: promptForAtlas,
              action: "lipsync",
              videoModel,
              audio_url,
              aspectRatio,
              resolution: resTier,
              duration,
              speed_tier
            };
            break;
          }
          case "Video Edit": {
            const video_url = await ensureAtlasPublicHttpsMediaUrl(ctx.editSourceVideoUrl);
            if (!video_url) {
              setGenerateError("Add a source video for Video Edit.");
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
              hostIsProduction: typeof window !== "undefined" && !window.location.hostname.includes("localhost")
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
          console.log("[VideoGenerationPage] Atlas video URL → player (sync response)", {
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
              console.log("[VideoGenerationPage] Atlas video URL → player (after poll)", {
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
                  typeof window !== "undefined" && !window.location.hostname.includes("localhost")
              });
              setGenerateError(
                pd.prediction_id && !isAtlasRealPersonImageError(pd.atlas_error ?? pd.error)
                  ? `${msg}\n\n(prediction: ${pd.prediction_id.slice(0, 12)}…)`
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
          ctx.actionTab === "Image to Video" && sourceInputForLog
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
            ctx.actionTab === "Image to Video" && sourceInputForLog
              ? sourceInputForLog
              : ctx.promptImageUrl,
          promptImage2Url: ctx.promptImage2Url,
          lipsyncAudioUrl:
            ctx.actionTab === "Lipsyncing" && sourceInputForLog ? sourceInputForLog : ctx.lipsyncAudioUrl,
          editSourceVideoUrl:
            ctx.actionTab === "Video Edit" && sourceInputForLog ? sourceInputForLog : ctx.editSourceVideoUrl
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
        } else {
          setActionTab(snap.actionTab);
        }
        setPromptImageUrlSafe(snap.promptImageUrl);
        setPromptImage2UrlSafe(snap.promptImage2Url);
        setLipsyncAudioUrlSafe(snap.lipsyncAudioUrl);
        setEditSourceVideoUrlSafe(snap.editSourceVideoUrl);
      } else if (item.title) {
        setPrompt((p) => `${p.split("\n")[0]}\n(Restored: ${item.title})`);
      }

      if (item.outputVideoUrl) {
        setGenerateError(null);
        const raw = item.outputVideoUrl;
        const resolved = normalizeAtlasVideoUrlForPlayback(raw);
        console.log("[VideoGenerationPage] restore history → player", {
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
      setLipsyncAudioUrlSafe,
      setPromptImage2UrlSafe,
      setPromptImageUrlSafe
    ]
  );

  const hidePromptThumb =
    composerModelId === KLING_30_PRO_MODEL_ID && actionTab === "Text to Video";

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
              onActionTabChange={setActionTab}
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
