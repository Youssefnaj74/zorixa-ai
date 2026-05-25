"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ImageActionTab } from "@/components/image/ImageActionTabsRow";
import type { ImageGenerateContext } from "@/components/image/ImageBottomBar";
import { ImageBottomBar } from "@/components/image/ImageBottomBar";
import type { ImageHistoryEntry } from "@/components/image/ImageHistory";
import { ImageHistory } from "@/components/image/ImageHistory";
import { ImagePreview } from "@/components/image/ImagePreview";
import {
  defaultGptImage2Selection,
  defaultSeedreamSelection,
  gptImage2SelectionForAspect,
  IMAGE_ASPECTS,
  IMAGE_RESOLUTIONS,
  isGptImage2SizeSelection,
  isSeedreamSizeSelection
} from "@/components/image/image-bottom-bar-constants";
import { Navbar } from "@/components/layout/Navbar";
import {
  imageComposerSupportedOnActionTab,
  isAtlasImageComposerId
} from "@/lib/atlas-image-model-ids";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  extractAtlasVideoOutputUrl,
  type AtlasLikeVideoPayload
} from "@/lib/extract-atlas-video-output-url";
import { EXPLORE_PROMPT_DEFAULT_ASPECT } from "@/lib/explore-prompts-catalog";
import {
  parseImageStudioLock,
  resolveImageStudioFromQuery
} from "@/lib/studio-catalog-link";
import {
  COMPOSER_DOCK_WITH_TABS_HEIGHT,
  IMAGE_I2I_DOCK_HEIGHT
} from "@/lib/composer-dock-height";
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
  const searchParams = useSearchParams();
  const studioLock = useMemo(() => parseImageStudioLock(searchParams), [searchParams]);
  const [bottomBarHeight, setBottomBarHeight] = useState(COMPOSER_DOCK_WITH_TABS_HEIGHT);

  const [actionTab, setActionTab] = useState<ImageActionTab>("Text to Image");
  const [prompt, setPrompt] = useState("");
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [modelId, setModelId] = useState("nano-banana-2");
  const [cameraStyle, setCameraStyle] = useState("None");
  const [resolution, setResolution] = useState("2K");
  const [aspect, setAspect] = useState("Auto");

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [history, setHistory] = useState<ImageHistoryEntry[]>([]);

  const creditsLine = "-90.00 CR";

  useEffect(() => {
    if (actionTab === "Image to Image") {
      setBottomBarHeight(IMAGE_I2I_DOCK_HEIGHT);
    } else {
      setBottomBarHeight(COMPOSER_DOCK_WITH_TABS_HEIGHT);
    }
  }, [actionTab]);

  useEffect(() => {
    const resolved = resolveImageStudioFromQuery(
      searchParams.get("tab"),
      searchParams.get("model")
    );
    if (resolved) {
      setActionTab(resolved.tab);
      setModelId(resolved.model);
      setGenerateError(null);
    }

    const promptFromQuery = searchParams.get("prompt")?.trim();
    if (promptFromQuery) {
      setPrompt(promptFromQuery);
    }

    const aspectFromQuery = searchParams.get("aspect")?.trim();
    const resolutionFromQuery = searchParams.get("resolution")?.trim();
    const modelFromQuery = resolved?.model ?? searchParams.get("model")?.trim();

    if (modelFromQuery === "gpt-image-2") {
      const gpt = gptImage2SelectionForAspect(aspectFromQuery || EXPLORE_PROMPT_DEFAULT_ASPECT);
      const res =
        resolutionFromQuery &&
        (IMAGE_RESOLUTIONS as readonly string[]).includes(resolutionFromQuery)
          ? resolutionFromQuery
          : gpt.resolution;
      const asp =
        aspectFromQuery && (IMAGE_ASPECTS as readonly string[]).includes(aspectFromQuery)
          ? aspectFromQuery
          : gpt.aspect;
      if (isGptImage2SizeSelection(res, asp)) {
        setResolution(res);
        setAspect(asp);
      } else {
        setResolution(gpt.resolution);
        setAspect(gpt.aspect);
      }
    } else {
      if (aspectFromQuery && IMAGE_ASPECTS.includes(aspectFromQuery as (typeof IMAGE_ASPECTS)[number])) {
        setAspect(aspectFromQuery);
      }
      if (
        resolutionFromQuery &&
        (IMAGE_RESOLUTIONS as readonly string[]).includes(resolutionFromQuery)
      ) {
        setResolution(resolutionFromQuery);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (modelId === "gpt-image-2") {
      const aspectFromQuery = searchParams.get("aspect")?.trim();
      const resolutionFromQuery = searchParams.get("resolution")?.trim();
      if (
        aspectFromQuery &&
        resolutionFromQuery &&
        isGptImage2SizeSelection(resolutionFromQuery, aspectFromQuery)
      ) {
        return;
      }
      if (!isGptImage2SizeSelection(resolution, aspect)) {
        const sel = gptImage2SelectionForAspect(
          aspectFromQuery && aspectFromQuery !== "Auto" ? aspectFromQuery : aspect
        );
        setResolution(sel.resolution);
        setAspect(sel.aspect);
      }
      return;
    }
    if (modelId === "seedream-5") {
      if (!isSeedreamSizeSelection(resolution, aspect)) {
        const d = defaultSeedreamSelection();
        setResolution(d.resolution);
        setAspect(d.aspect);
      }
      return;
    }
    if (resolution === "3K") setResolution("4K");
    if (!(IMAGE_ASPECTS as readonly string[]).includes(aspect)) setAspect("Auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- normalize only when `modelId` changes
  }, [modelId]);

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
      if (loading) return;

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

        const rawText = await res.text();
        let data: {
          image_url?: string;
          pending?: boolean;
          prediction_id?: string;
          poll_interval_ms?: number;
          error?: string;
        } = {};
        try {
          data = rawText ? (JSON.parse(rawText) as typeof data) : {};
        } catch {
          setGenerateError(
            rawText.trim().slice(0, 200) || `Generation failed (${res.status})`
          );
          return;
        }

        if (!res.ok) {
          setGenerateError(
            data.error ?? (rawText.trim().slice(0, 200) || `Generation failed (${res.status})`)
          );
          return;
        }

        let finalImageUrl: string | null = pickImageUrlFromPollBody(data as Record<string, unknown>);
        let predictionIdForLog: string | null = pickPredictionIdFromPost(data);

        if (!finalImageUrl && predictionIdForLog && data.pending !== false) {
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
          ...prev.filter((h) => h.outputImageUrl !== finalImageUrl)
        ]);
      } catch (e: unknown) {
        setGenerateError(e instanceof Error ? e.message : "Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [aspect, loading, modelId, prompt, resolution]
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
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:min-h-0">
            {studioLock ? (
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(131,56,235,0.25)] bg-[#1a1a24]/90 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
                    Tool · {studioLock.tab}
                  </p>
                  <p className="truncate font-display text-sm font-semibold text-white">
                    {studioLock.toolTitle ?? studioLock.modelId}
                  </p>
                </div>
                <Link
                  href="/tools"
                  className="shrink-0 text-xs font-medium text-zorixa-muted transition-colors hover:text-white"
                >
                  All tools
                </Link>
              </div>
            ) : null}
            <ImagePreview
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
        onActionTabChange={(tab) => {
          setActionTab(tab);
          setGenerateError(null);
        }}
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
        creditsLine={creditsLine}
        loadingGenerate={loading}
        onGenerate={runGeneration}
        onHeightChange={setBottomBarHeight}
        studioLock={studioLock}
      />
    </div>
  );
}
