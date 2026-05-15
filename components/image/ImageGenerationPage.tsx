"use client";

import { useCallback, useState } from "react";

import type { ImageActionTab } from "@/components/image/ImageActionTabsRow";
import type { ImageGenerateContext } from "@/components/image/ImageBottomBar";
import { ImageBottomBar } from "@/components/image/ImageBottomBar";
import type { ImageHistoryEntry } from "@/components/image/ImageHistory";
import { ImageHistory } from "@/components/image/ImageHistory";
import { ImagePreview } from "@/components/image/ImagePreview";
import { Navbar } from "@/components/layout/Navbar";
import { isAtlasImageComposerId } from "@/lib/atlas-image-model-ids";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  extractAtlasVideoOutputUrl,
  type AtlasLikeVideoPayload
} from "@/lib/extract-atlas-video-output-url";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";

const NAV_H = 56;
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
  return coerceToPublicHttpsUrl(data.url);
}

export function ImageGenerationPage() {
  const [bottomBarHeight, setBottomBarHeight] = useState(130);

  const [actionTab, setActionTab] = useState<ImageActionTab>("Text to Image");
  const [prompt, setPrompt] = useState("");
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [modelId, setModelId] = useState("nano-banana-2");
  const [cameraStyle, setCameraStyle] = useState("None");
  const [resolution, setResolution] = useState("2K");
  const [aspect, setAspect] = useState("Auto");
  const [webSearch, setWebSearch] = useState(false);

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [history, setHistory] = useState<ImageHistoryEntry[]>([
    {
      id: "h1",
      thumb: "https://picsum.photos/seed/neon/96/96",
      title: "Neon portrait concept"
    },
    {
      id: "h2",
      thumb: "https://picsum.photos/seed/mountain/96/96",
      title: "Studio packshot v2"
    }
  ]);

  const creditsLine = "-90.00 CR";

  const setReferenceUrlsSafe = useCallback((urls: string[]) => {
    setReferenceUrls((prev) => {
      for (const u of prev) {
        if (u.startsWith("blob:") && !urls.includes(u)) URL.revokeObjectURL(u);
      }
      return urls;
    });
  }, []);

  const runGeneration = useCallback(
    async (ctx: ImageGenerateContext) => {
      setGenerateError(null);
      setImageUrl(null);

      const promptValue = ctx.promptText.trim() || prompt.trim();
      const promptForAtlas = stripVideoComposerAssetTokens(promptValue);
      if (!isAtlasImageComposerId(modelId)) {
        setGenerateError("Unsupported image model.");
        return;
      }

      if (!promptForAtlas) {
        setGenerateError("Enter a prompt to generate an image.");
        return;
      }

      if (ctx.actionTab === "Image to Image" && ctx.referenceUrls.length === 0) {
        setGenerateError("Add at least one reference image for Image to Image.");
        return;
      }

      setLoading(true);
      try {
        const image_urls: string[] = [];
        for (const refUrl of ctx.referenceUrls) {
          const uploaded = await ensureAtlasPublicHttpsMediaUrl(refUrl);
          if (uploaded) image_urls.push(uploaded);
        }

        const payload: Record<string, unknown> = {
          prompt: promptForAtlas,
          imageModel: modelId,
          aspectRatio: ctx.aspectRatio.trim(),
          resolution: ctx.resolution.trim(),
          num_images: ctx.batchCount
        };
        if (image_urls.length > 0) payload.image_urls = image_urls;

        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });

        let data: {
          image_url?: string;
          pending?: boolean;
          prediction_id?: string;
          poll_interval_ms?: number;
          error?: string;
        } = {};
        try {
          data = (await res.json()) as typeof data;
        } catch {
          setGenerateError(`Generation failed (${res.status})`);
          return;
        }

        if (!res.ok) {
          setGenerateError(data.error ?? `Generation failed (${res.status})`);
          return;
        }

        let finalImageUrl: string | null = pickImageUrlFromPollBody(data as Record<string, unknown>);

        if (!finalImageUrl && pickPredictionIdFromPost(data) && data.pending !== false) {
          const predictionId = pickPredictionIdFromPost(data);
          if (!predictionId) {
            setGenerateError("No image URL or job id was returned.");
            return;
          }
          const interval = data.poll_interval_ms ?? ATLAS_CLIENT_POLL_MS;
          const deadline = Date.now() + ATLAS_CLIENT_MAX_WAIT_MS;
          while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, interval));
            const pr = await fetch(
              `/api/generate-image?predictionId=${encodeURIComponent(predictionId)}`,
              { cache: "no-store", credentials: "include" }
            );
            let pd: {
              image_url?: string | null;
              status?: string;
              error?: string | null;
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
            const polled = pickImageUrlFromPollBody(pd as Record<string, unknown>);
            if (polled) {
              finalImageUrl = polled;
              break;
            }
            if ((pd.status ?? "").toLowerCase() === "failed") {
              setGenerateError(pd.error ?? "Atlas prediction failed");
              return;
            }
            if (atlasTerminalSuccessStatus(pd.status) && !polled) {
              setGenerateError("Generation finished but no image URL was returned.");
              return;
            }
          }
        }

        if (!finalImageUrl) {
          setGenerateError("Image generation timed out. Check your connection and try again.");
          return;
        }

        setImageUrl(finalImageUrl);
        const id = `img-${Date.now()}`;
        setHistory((prev) => [
          {
            id,
            thumb: finalImageUrl,
            title: promptForAtlas.slice(0, 42) || modelId,
            outputImageUrl: finalImageUrl
          },
          ...prev
        ]);
      } catch (e: unknown) {
        setGenerateError(e instanceof Error ? e.message : "Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [aspect, modelId, prompt, resolution]
  );

  const restoreHistory = useCallback((item: ImageHistoryEntry) => {
    const url = item.outputImageUrl ?? item.thumb;
    if (url.startsWith("http")) {
      setGenerateError(null);
      setImageUrl(url);
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-zorixa-bg">
      <Navbar fixed />

      <div
        className="box-border flex min-h-0 flex-1 flex-col px-4 pt-0"
        style={{ marginTop: NAV_H, paddingBottom: bottomBarHeight }}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col gap-4 overflow-x-hidden font-body lg:flex-row lg:items-stretch lg:gap-5">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-0">
            <ImagePreview
              actionTab={actionTab}
              onActionTabChange={setActionTab}
              imageUrl={imageUrl}
              loading={loading}
              errorMessage={generateError}
              referenceThumbUrl={referenceUrls[0] ?? null}
              bottomBarHeight={bottomBarHeight}
              className="scrollbar-hide h-full min-h-0 w-full min-w-0 flex-1"
            />
          </div>

          <ImageHistory
            items={history}
            onSelect={restoreHistory}
            className="h-auto max-h-[min(42vh,380px)] min-h-0 w-full shrink-0 lg:h-full lg:max-h-none lg:w-[300px] lg:min-w-[300px] lg:max-w-[300px]"
          />
        </div>
      </div>

      <ImageBottomBar
        prompt={prompt}
        onPromptChange={(v) => {
          setGenerateError(null);
          setPrompt(v);
        }}
        actionTab={actionTab}
        referenceUrls={referenceUrls}
        onReferenceUrlsChange={setReferenceUrlsSafe}
        modelId={modelId}
        onModelChange={(id) => {
          setModelId(id);
          setGenerateError(null);
        }}
        cameraStyle={cameraStyle}
        onCameraStyleChange={setCameraStyle}
        resolution={resolution}
        onResolutionChange={setResolution}
        aspect={aspect}
        onAspectChange={setAspect}
        webSearch={webSearch}
        onWebSearchChange={setWebSearch}
        creditsLine={creditsLine}
        loadingGenerate={loading}
        onGenerate={runGeneration}
        onHeightChange={setBottomBarHeight}
      />
    </div>
  );
}
