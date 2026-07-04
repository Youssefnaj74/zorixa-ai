"use client";

import { useCallback, useMemo, useState } from "react";

import { HistoryPanel, LipsyncStrip, type HistoryItem } from "@/components/layout/HistoryPanel";
import {
  ImageBottomBar,
  type ImageGenerateContext
} from "@/components/layout/ImageBottomBar";
import { Navbar } from "@/components/layout/Navbar";
import { NAV_H } from "@/lib/nav-chrome";
import { PromptBar } from "@/components/layout/PromptBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { OutputPreview } from "@/components/ui/OutputPreview";
import {
  getAtlasImageModelLimits,
  isAtlasImageComposerId
} from "@/lib/atlas-image-model-ids";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  extractAtlasVideoOutputUrl,
  type AtlasLikeVideoPayload
} from "@/lib/extract-atlas-video-output-url";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";
import {
  creditsChargedForImageModel,
  creditsChargedForVideoModel,
  formatGenerationCreditsLine
} from "@/lib/atlas-pricing-catalog";
import { useCredits } from "@/lib/hooks/use-credits";
import { cn } from "@/lib/utils";

const ATLAS_CLIENT_POLL_MS = 3000;
const ATLAS_CLIENT_MAX_WAIT_MS = 15 * 60 * 1000;

function atlasTerminalSuccessStatus(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "succeeded" || s === "completed";
}

function pickPredictionIdFromPost(data: {
  prediction_id?: string;
  predictionId?: string;
}): string | null {
  const snake = typeof data.prediction_id === "string" ? data.prediction_id.trim() : "";
  if (snake.length > 0) return snake;
  const camel = typeof data.predictionId === "string" ? data.predictionId.trim() : "";
  return camel.length > 0 ? camel : null;
}

function pickImageUrlFromPollBody(data: Record<string, unknown>): string | null {
  for (const v of [data.image_url, data.imageUrl]) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return extractAtlasVideoOutputUrl(data as unknown as AtlasLikeVideoPayload);
}

function extensionForUploadedBlob(blob: Blob): string {
  const mt = (blob.type || "").toLowerCase();
  if (mt.includes("jpeg") || mt === "image/jpg") return "jpg";
  if (mt === "image/png") return "png";
  if (mt === "image/webp") return "webp";
  if (mt === "image/gif") return "gif";
  return "png";
}

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

export function GenerationWorkbench({ mode }: { mode: "image" | "video" }) {
  const { refresh: refreshCredits } = useCredits();
  const [referencePreviewUrls, setReferencePreviewUrls] = useState<string[]>([]);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [negativeOpen, setNegativeOpen] = useState(false);

  const [modelId, setModelId] = useState("nano-banana-2");
  const [cameraStyle, setCameraStyle] = useState("None");
  const [resolution, setResolution] = useState("2K");
  const [aspect, setAspect] = useState("Auto");
  const [webSearch, setWebSearch] = useState(false);
  const [crispUpscale, setCrispUpscale] = useState(false);

  const [durationSec, setDurationSec] = useState(5);
  const [fps, setFps] = useState(24);
  const [motion, setMotion] = useState(50);

  const [loading, setLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const creditsLabelImage = formatGenerationCreditsLine(creditsChargedForImageModel(modelId));
  const creditsLabelVideo = formatGenerationCreditsLine(creditsChargedForVideoModel("seedance-2"));

  const applyReferenceFiles = useCallback(
    (files: File[]) => {
      const max = getAtlasImageModelLimits(modelId).maxImages;

      const incoming = files.filter((f) => f.type.startsWith("image/"));
      if (!incoming.length) return;

      setReferencePreviewUrls((prev) => {
        const next = [...prev];
        for (const f of incoming) {
          if (next.length >= max) break;
          next.push(URL.createObjectURL(f));
        }
        return next;
      });

      setPrompt((p) => {
        let next = p;
        const base = next.replace(/^Using\s*/i, "").trim();
        next = base;
        const hasUsing = /^Using\s/i.test(p);
        const currentCount = referencePreviewUrls.length;
        const addCount = Math.min(max - currentCount, incoming.length);
        for (let i = 1; i <= currentCount + addCount; i++) {
          const token = `@PRODUCT_IMAGE${i}`;
          if (!next.includes(token)) {
            next = `${next} ${token}`.trim();
          }
        }
        const withUsing = hasUsing || next.includes("@PRODUCT_IMAGE1") ? `Using ${next}` : next;
        return withUsing.trim();
      });
    },
    [modelId, referencePreviewUrls.length]
  );

  const removeReferenceAt = useCallback((index: number) => {
    setReferencePreviewUrls((prev) => {
      const url = prev[index];
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const runImageGeneration = useCallback(
    async (ctx: ImageGenerateContext) => {
      setGenerateError(null);
      setOutputUrl(null);

      const promptValue = ctx.promptText.trim() || prompt.trim();
      const promptForAtlas = stripVideoComposerAssetTokens(promptValue);
      const negativeValue = ctx.negativePromptText.trim() || negativePrompt.trim();

      if (!isAtlasImageComposerId(modelId)) {
        setGenerateError("Unsupported image model.");
        return;
      }

      if (!promptForAtlas) {
        setGenerateError("Enter a prompt to generate an image.");
        return;
      }

      setLoading(true);
      try {
        const image_urls: string[] = [];
        for (const refUrl of referencePreviewUrls) {
          const uploaded = await ensureAtlasPublicHttpsMediaUrl(refUrl);
          if (uploaded) image_urls.push(uploaded);
        }

        const payload: Record<string, unknown> = {
          prompt: promptForAtlas,
          imageModel: modelId,
          aspectRatio: aspect.trim(),
          resolution: resolution.trim(),
          num_images: ctx.batchCount
        };
        if (negativeValue) payload.negativePrompt = negativeValue;
        if (image_urls.length > 0) payload.image_urls = image_urls;

        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });

        let data: {
          image_url?: string;
          imageUrl?: string;
          pending?: boolean;
          prediction_id?: string;
          predictionId?: string;
          poll_interval_ms?: number;
          credits_balance?: number;
          credits_required?: number;
          error?: string;
        } = {};
        try {
          data = (await res.json()) as typeof data;
        } catch {
          setGenerateError(`Generation failed (${res.status})`);
          return;
        }

        if (!res.ok) {
          if (res.status === 402 && data.error === "INSUFFICIENT_CREDITS") {
            setGenerateError(
              `Not enough credits (need ${data.credits_required ?? "?"}, you have ${data.credits_balance ?? 0}).`
            );
            return;
          }
          setGenerateError(data.error ?? `Generation failed (${res.status})`);
          return;
        }

        void refreshCredits();

        let finalImageUrl: string | null = null;
        let predictionIdForLog: string | null = pickPredictionIdFromPost(data);

        const syncUrl = pickImageUrlFromPollBody(data as Record<string, unknown>);
        if (syncUrl) {
          finalImageUrl = syncUrl;
          setOutputUrl(finalImageUrl);
        } else if (predictionIdForLog && data.pending !== false) {
          const predictionId = predictionIdForLog;
          if (!predictionId) {
            setGenerateError("No image URL or job id was returned.");
            return;
          }
          const interval = data.poll_interval_ms ?? ATLAS_CLIENT_POLL_MS;
          const deadline = Date.now() + ATLAS_CLIENT_MAX_WAIT_MS;
          while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, interval));
            const pr = await fetch(
              `/api/generate-image?predictionId=${encodeURIComponent(predictionId)}&imageModel=${encodeURIComponent(modelId)}`,
              { cache: "no-store", credentials: "include" }
            );
            let pd: {
              image_url?: string | null;
              imageUrl?: string | null;
              outputs?: unknown;
              output?: unknown;
              status?: string;
              error?: string | null;
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
            const polledUrl = pickImageUrlFromPollBody(pd as Record<string, unknown>);
            const statusNorm = (pd.status ?? "").toLowerCase();

            if (polledUrl) {
              finalImageUrl = polledUrl;
              setOutputUrl(finalImageUrl);
              break;
            }
            if (statusNorm === "failed") {
              setGenerateError(pd.error ?? "Atlas prediction failed");
              return;
            }
            if (atlasTerminalSuccessStatus(pd.status) && !polledUrl) {
              setGenerateError("Generation finished but no image URL was returned.");
              return;
            }
          }
          if (!finalImageUrl) {
            setGenerateError("Image generation timed out. Check your connection and try again.");
            return;
          }
        } else {
          setGenerateError("No image URL or job id was returned.");
          return;
        }

        const id = `gen-${Date.now()}`;
        const thumbForHistory = finalImageUrl ?? `https://picsum.photos/seed/${id.slice(-4)}/96/96`;
        setHistory((prev) => [
          {
            id,
            thumb: thumbForHistory,
            outputUrl: finalImageUrl ?? undefined,
            label: promptForAtlas.slice(0, 42) || "New generation"
          },
          ...prev.filter((h) => h.outputUrl !== finalImageUrl)
        ]);
      } catch (e: unknown) {
        setGenerateError(e instanceof Error ? e.message : "Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [aspect, modelId, negativePrompt, prompt, referencePreviewUrls, resolution]
  );

  const runVideoGeneration = useCallback(() => {
    setLoading(true);
    setOutputUrl(null);
    window.setTimeout(() => {
      const url =
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
      setOutputUrl(url);
      setLoading(false);
      const id = `gen-${Date.now()}`;
      setHistory((prev) => [
        {
          id,
          thumb: "https://picsum.photos/seed/vid/96/96",
          label: prompt.slice(0, 42) || "New generation"
        },
        ...prev
      ]);
    }, 1600);
  }, [prompt]);

  const historyItems = useMemo(() => history.slice(0, 8), [history]);

  const restoreHistoryItem = useCallback((item: HistoryItem) => {
    const url = item.outputUrl ?? item.thumb;
    if (url.startsWith("http")) {
      setGenerateError(null);
      setOutputUrl(url);
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-zorixa-bg font-sans text-white">
      <Navbar />

      {mode === "video" ? (
        <PromptBar
          prompt={prompt}
          onPromptChange={setPrompt}
          negativePrompt={negativePrompt}
          onNegativePromptChange={setNegativePrompt}
          showNegative={negativeOpen}
          onToggleNegative={() => setNegativeOpen((s) => !s)}
          placeholder="Describe motion, camera moves, and subject…"
        />
      ) : null}

      <div
        className={cn(
          mode === "video"
            ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row lg:items-stretch"
            : "flex min-h-0 w-full shrink-0 flex-row gap-4 overflow-hidden px-4 pt-4"
        )}
        style={
          mode === "image"
            ? {
                height: `calc(100vh - ${NAV_H}px)`,
                paddingBottom: 100
              }
            : undefined
        }
      >
        {mode === "video" ? (
          <Sidebar
            variant={mode}
            modelId={modelId}
            onModelChange={setModelId}
            cameraStyle={cameraStyle}
            onCameraStyleChange={setCameraStyle}
            resolution={resolution}
            onResolutionChange={setResolution}
            aspect={aspect}
            onAspectChange={setAspect}
            webSearch={webSearch}
            onWebSearchChange={setWebSearch}
            crispUpscale={crispUpscale}
            onCrispUpscaleChange={setCrispUpscale}
            creditsLabel={creditsLabelVideo}
            loading={loading}
            onGenerate={runVideoGeneration}
            durationSec={durationSec}
            onDurationChange={setDurationSec}
            fps={fps}
            onFpsChange={setFps}
            motion={motion}
            onMotionChange={setMotion}
          />
        ) : null}

        {mode === "video" ? (
          <div className="flex min-h-[420px] min-w-0 flex-1 flex-col gap-4 lg:flex-row">
            <OutputPreview
              mode={mode}
              imageSrc={outputUrl}
              loading={loading}
              className="min-h-[360px] flex-1"
            />

            <div className="flex shrink-0 gap-2 lg:flex-col xl:flex-row">
              <HistoryPanel items={historyItems} className="lg:max-w-none" />
              <LipsyncStrip />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-row items-stretch gap-4 overflow-hidden">
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <OutputPreview
                mode={mode}
                imageSrc={outputUrl}
                loading={loading}
                className="h-full min-h-0 flex-1 overflow-hidden"
              />
            </div>

            <HistoryPanel
              items={historyItems}
              onSelectItem={restoreHistoryItem}
              className="flex h-full min-h-0 w-[300px] min-w-[300px] max-w-[300px] shrink-0 flex-col self-stretch"
            />
          </div>
        )}
      </div>

      {mode === "image" ? (
        <ImageBottomBar
          prompt={prompt}
          onPromptChange={setPrompt}
          negativePrompt={negativePrompt}
          onNegativePromptChange={setNegativePrompt}
          showNegative={negativeOpen}
          onToggleNegative={() => setNegativeOpen((s) => !s)}
          referencePreviewUrls={referencePreviewUrls}
          onReferenceFiles={applyReferenceFiles}
          onRemoveReferenceAt={removeReferenceAt}
          modelId={modelId}
          onModelChange={(id) => {
            setModelId(id);
            setGenerateError(null);
          }}
          resolution={resolution}
          onResolutionChange={setResolution}
          aspect={aspect}
          onAspectChange={setAspect}
          cameraStyle={cameraStyle}
          onCameraStyleChange={setCameraStyle}
          webSearch={webSearch}
          onWebSearchChange={setWebSearch}
          creditsLabel={creditsLabelImage}
          loading={loading}
          generateError={generateError}
          onGenerate={runImageGeneration}
        />
      ) : null}
    </div>
  );
}