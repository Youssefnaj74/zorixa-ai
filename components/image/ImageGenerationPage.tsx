"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { pollGenerationJob } from "@/components/studio/batch-jobs";
import { MODEL_OPTIONS } from "@/components/ui/ModelDropdown";
import { Navbar } from "@/components/layout/Navbar";
import { AuthRequiredModal } from "@/components/onboarding/AuthRequiredModal";
import { InsufficientCreditsModal } from "@/components/onboarding/InsufficientCreditsModal";
import {
  clampImageBatchCount,
  getAtlasImageModelLimits,
  imageComposerSupportedOnActionTab,
  isAtlasImageComposerId
} from "@/lib/atlas-image-model-ids";
import type { UpscaleTier } from "@/lib/studio-constants";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  extractAtlasImageOutputUrls,
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
import { applyImageCameraStyle } from "@/lib/image-camera-style-prompt";
import { composerModelDisplayLabel } from "@/lib/composer-model-label";
import { imageI2iUsesStyleSlot } from "@/lib/image-i2i-model-slots";
import { getImageModelShowcase, showcaseAssetUrl } from "@/lib/image-model-showcase";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";
import {
  creditsChargedForImageModel,
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

import { NAV_H } from "@/lib/nav-chrome";
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

function pickPredictionIdsFromPost(data: {
  prediction_id?: string;
  predictionId?: string;
  prediction_ids?: string[];
}): string[] {
  if (Array.isArray(data.prediction_ids)) {
    const ids = data.prediction_ids
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      .map((id) => id.trim());
    if (ids.length > 0) return ids;
  }
  const one = pickPredictionIdFromPost(data);
  return one ? [one] : [];
}

async function pollAtlasImagePrediction(
  predictionId: string,
  modelId: string,
  interval: number,
  deadline: number
): Promise<string[]> {
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    const pr = await fetch(
      `/api/generate-image?predictionId=${encodeURIComponent(predictionId)}&imageModel=${encodeURIComponent(modelId)}`,
      { cache: "no-store", credentials: "include" }
    );
    let pd: Record<string, unknown> = {};
    try {
      pd = (await pr.json()) as Record<string, unknown>;
    } catch {
      throw new Error(`Status check failed (${pr.status})`);
    }
    if (!pr.ok) {
      const err =
        typeof pd.error === "string" ? pd.error : `Status check failed (${pr.status})`;
      throw new Error(err);
    }
    const urls = pickImageUrlsFromPollBody(pd);
    if (urls.length > 0) return urls;
    const status = String(pd.status ?? "").toLowerCase();
    if (status === "failed") {
      throw new Error(
        typeof pd.error === "string" ? pd.error : "Atlas prediction failed"
      );
    }
    if (atlasTerminalSuccessStatus(String(pd.status ?? "")) && urls.length === 0) {
      throw new Error("Generation finished but no image URL was returned.");
    }
  }
  return [];
}

function pickImageUrlsFromPollBody(data: Record<string, unknown>): string[] {
  const listed = data.image_urls;
  if (Array.isArray(listed)) {
    const urls = listed
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim());
    if (urls.length > 0) return urls;
  }
  const fromAtlas = extractAtlasImageOutputUrls(data as unknown as AtlasLikeVideoPayload);
  if (fromAtlas.length > 0) return fromAtlas;
  for (const v of [data.image_url, data.imageUrl]) {
    if (typeof v === "string" && v.trim().length > 0) return [v.trim()];
  }
  const one = extractAtlasVideoOutputUrl(data as unknown as AtlasLikeVideoPayload);
  return one ? [one] : [];
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
    if (up.status === 401) {
      throw new Error("AUTH_REQUIRED");
    }
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

function defaultImageModelForTab(tab: ImageActionTab): string {
  const models = MODEL_OPTIONS.filter((m) => imageComposerSupportedOnActionTab(m.id, tab));
  return models[0]?.id ?? "nano-banana-2";
}

function defaultImageSettingsForModel(model: string): {
  resolution: string;
  aspect: string;
} {
  if (model === "gpt-image-2") {
    const gpt = defaultGptImage2Selection();
    return { resolution: gpt.resolution, aspect: gpt.aspect };
  }
  if (model === "seedream-5") {
    const sd = defaultSeedreamSelection();
    return { resolution: sd.resolution, aspect: sd.aspect };
  }
  return { resolution: "2K", aspect: "Auto" };
}

export function ImageGenerationPage() {
  usePageViewEvent(AnalyticsEvents.IMAGE_STUDIO_VIEWED);
  const { credits, refresh: refreshCredits } = useCredits();
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
  const [batchCount, setBatchCount] = useState(1);

  const [loading, setLoading] = useState(false);
  const [outputUrls, setOutputUrls] = useState<string[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState<InsufficientCreditsState>(
    CLOSED_INSUFFICIENT_CREDITS
  );
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);
  const [hasUserGenerated, setHasUserGenerated] = useState(false);

  const [history, setHistory] = useState<ImageHistoryEntry[]>([]);
  const appliedShowcaseForModel = useRef<string | null>(null);

  const modelShowcase = useMemo(
    () => getImageModelShowcase(modelId, actionTab),
    [actionTab, modelId]
  );
  const showingModelShowcase = Boolean(
    modelShowcase &&
      outputUrls.length === 0 &&
      !loading &&
      !hasUserGenerated &&
      !studioLock
  );
  const previewUrls =
    showingModelShowcase && modelShowcase ? [modelShowcase.imageUrl] : outputUrls;

  const historyItems = useMemo(() => {
    if (!showingModelShowcase || !modelShowcase) return history;
    const exampleEntry: ImageHistoryEntry = {
      id: `showcase-${modelShowcase.modelId}`,
      thumb: modelShowcase.imageUrl,
      title: modelShowcase.historyTitle,
      subtitle: `Example · ${composerModelDisplayLabel(modelShowcase.modelId, "image")}`,
      outputImageUrl: modelShowcase.imageUrl
    };
    return [exampleEntry, ...history];
  }, [history, modelShowcase, showingModelShowcase]);

  const creditsLine = useMemo(
    () =>
      formatGenerationCreditsLine(
        creditsChargedForImageModel(modelId, batchCount, {
          resolution,
          isEdit: actionTab === "Image to Image"
        })
      ),
    [actionTab, batchCount, modelId, resolution]
  );

  useEffect(() => {
    setBatchCount((c) => clampImageBatchCount(modelId, c));
  }, [modelId]);

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

  const applyModelShowcase = useCallback(
    (nextModelId: string, tab: ImageActionTab) => {
      if (studioLock) return;
      if (searchParams.get("prompt")?.trim()) return;
      if (hasUserGenerated) return;

      const showcase = getImageModelShowcase(nextModelId, tab);
      const showcaseKey = `${nextModelId}:${tab}`;
      if (!showcase) {
        appliedShowcaseForModel.current = null;
        return;
      }
      if (appliedShowcaseForModel.current === showcaseKey) return;

      setPrompt(showcase.prompt);
      setCameraStyle(showcase.cameraStyle);
      setResolution(showcase.resolution);
      setAspect(showcase.aspect);
      setGenerateError(null);
      appliedShowcaseForModel.current = showcaseKey;

      if (tab === "Image to Image") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const paths = [showcase.referenceImageUrl];
        if (imageI2iUsesStyleSlot(nextModelId) && showcase.styleImageUrl) {
          paths.push(showcase.styleImageUrl);
        }
        const refs = paths
          .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
          .map((path) => showcaseAssetUrl(path, origin));
        setReferenceUrlsSafe(refs);
      } else {
        setReferenceUrlsSafe([]);
      }
    },
    [hasUserGenerated, searchParams, setReferenceUrlsSafe, studioLock]
  );

  useEffect(() => {
    applyModelShowcase(modelId, actionTab);
  }, [actionTab, applyModelShowcase, modelId]);

  const runGeneration = useCallback(
    async (ctx: ImageGenerateContext) => {
      if (loading) return;

      setGenerateError(null);
      setOutputUrls([]);

      const promptValue = ctx.promptText.trim() || prompt.trim();
      const promptForAtlas = stripVideoComposerAssetTokens(
        applyImageCameraStyle(promptValue, ctx.cameraStyle)
      );
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

      const requiredCredits = creditsChargedForImageModel(modelId, ctx.batchCount, {
        resolution: ctx.resolution.trim(),
        isEdit: ctx.actionTab === "Image to Image"
      });
      if (shouldBlockForInsufficientCredits(credits, requiredCredits, "image")) {
        setInsufficientCredits({ open: true, required: requiredCredits, balance: credits });
        return;
      }

      trackFirstGenerationStarted("image");
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
          image_urls?: string[];
          batch?: boolean;
          pending?: boolean;
          prediction_id?: string;
          prediction_ids?: string[];
          poll_interval_ms?: number;
          credits_spent?: number;
          credits_balance?: number;
          credits_required?: number;
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
            data.error ?? (rawText.trim().slice(0, 200) || `Generation failed (${res.status})`)
          );
          return;
        }

        void refreshCredits();

        const predictionIds = pickPredictionIdsFromPost(data);
        const collected = new Set(pickImageUrlsFromPollBody(data as Record<string, unknown>));

        const needsPoll =
          predictionIds.length > 0 &&
          (data.pending !== false || collected.size < predictionIds.length);

        if (needsPoll) {
          const interval = data.poll_interval_ms ?? ATLAS_CLIENT_POLL_MS;
          const deadline = Date.now() + ATLAS_CLIENT_MAX_WAIT_MS;
          const pollErrors: string[] = [];

          if (data.batch && predictionIds.length > 1) {
            await Promise.all(
              predictionIds.map(async (predictionId) => {
                try {
                  const urls = await pollAtlasImagePrediction(
                    predictionId,
                    modelId,
                    interval,
                    deadline
                  );
                  for (const u of urls) collected.add(u);
                } catch (e: unknown) {
                  pollErrors.push(
                    e instanceof Error ? e.message : "One image in the batch failed."
                  );
                }
              })
            );
          } else {
            const predictionId = predictionIds[0];
            if (!predictionId) {
              setGenerateError("No image URL or job id was returned.");
              return;
            }
            try {
              const urls = await pollAtlasImagePrediction(
                predictionId,
                modelId,
                interval,
                deadline
              );
              for (const u of urls) collected.add(u);
            } catch (e: unknown) {
              setGenerateError(
                e instanceof Error ? e.message : "Image generation failed."
              );
              return;
            }
          }

          if (collected.size === 0) {
            setGenerateError(
              pollErrors[0] ?? "Image generation timed out. Check your connection and try again."
            );
            return;
          }
        }

        const outputUrls = [...collected];

        if (outputUrls.length === 0) {
          setGenerateError("Image generation timed out. Check your connection and try again.");
          return;
        }

        setOutputUrls(outputUrls);
        setHasUserGenerated(true);
        trackFirstGenerationCompleted("image");
        appliedShowcaseForModel.current = modelId;
        const baseTitle = promptForAtlas.slice(0, 42) || modelId;
        setHistory((prev) => {
          const newEntries: ImageHistoryEntry[] = outputUrls.map((url, i) => ({
            id: `img-${Date.now()}-${i}`,
            thumb: url,
            title: outputUrls.length > 1 ? `${baseTitle} (${i + 1}/${outputUrls.length})` : baseTitle,
            subtitle: outputUrls.length > 1 ? "Batch output" : undefined,
            outputImageUrl: url
          }));
          const urlSet = new Set(outputUrls);
          return [...newEntries, ...prev.filter((h) => !h.outputImageUrl || !urlSet.has(h.outputImageUrl))];
        });
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "AUTH_REQUIRED") {
          setAuthRequiredOpen(true);
          setGenerateError(GENERATION_AUTH_MESSAGE);
          return;
        }
        setGenerateError(e instanceof Error ? e.message : "Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [aspect, credits, loading, modelId, prompt, refreshCredits, resolution, batchCount]
  );

  const restoreHistory = useCallback(
    (item: ImageHistoryEntry) => {
      if (item.id.startsWith("showcase-")) {
        setGenerateError(null);
        setOutputUrls([]);
        setHasUserGenerated(false);
        appliedShowcaseForModel.current = null;
        applyModelShowcase(modelId, actionTab);
        return;
      }
      const url = item.outputImageUrl ?? item.thumb;
      if (url.startsWith("http") || url.startsWith("/")) {
        setGenerateError(null);
        setOutputUrls([url]);
        setHasUserGenerated(true);
      }
    },
    [actionTab, applyModelShowcase, modelId]
  );

  const currentGenerateContext = useMemo(
    (): ImageGenerateContext => ({
      promptText: prompt,
      actionTab,
      aspectRatio: aspect,
      resolution,
      referenceUrls,
      batchCount,
      cameraStyle
    }),
    [actionTab, aspect, batchCount, cameraStyle, prompt, referenceUrls, resolution]
  );

  const canPostProcessImage = hasUserGenerated && outputUrls.length > 0 && !showingModelShowcase;
  const canRunVariations = getAtlasImageModelLimits(modelId).maxBatch >= 2;

  const resetImageTabDefaults = useCallback(() => {
    setGenerateError(null);
    setPrompt("");
    setCameraStyle("None");
    setBatchCount(1);
    setReferenceUrlsSafe([]);

    const defaultModel = studioLock?.modelId ?? defaultImageModelForTab(actionTab);
    const defaults = defaultImageSettingsForModel(defaultModel);
    setModelId(defaultModel);
    setResolution(defaults.resolution);
    setAspect(defaults.aspect);
    appliedShowcaseForModel.current = null;
    applyModelShowcase(defaultModel, actionTab);
  }, [actionTab, applyModelShowcase, setReferenceUrlsSafe, studioLock?.modelId]);

  const runImageUpscale = useCallback(
    async (tier: UpscaleTier) => {
      const source = outputUrls[0];
      if (!source || loading || showingModelShowcase) {
        setGenerateError("Generate an image first, then upscale it.");
        return;
      }

      setGenerateError(null);
      setLoading(true);
      try {
        const inputUrl = await ensureAtlasPublicHttpsMediaUrl(source);
        if (!inputUrl) {
          setGenerateError("Could not prepare your image for upscale. Try again in a moment.");
          return;
        }

        const res = await fetch("/api/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input_url: inputUrl,
            model: "real_esrgan",
            upscale: tier
          }),
          credentials: "include"
        });

        const data = (await res.json()) as {
          id?: string;
          status?: string;
          output_url?: string;
          error?: string;
          credits_balance?: number;
          credits_required?: number;
        };

        if (res.status === 401) {
          setAuthRequiredOpen(true);
          setGenerateError(GENERATION_AUTH_MESSAGE);
          return;
        }
        if (res.status === 402) {
          setGenerateError(insufficientCreditsMessage(data));
          return;
        }
        if (!res.ok) {
          setGenerateError(data.error ?? `Upscale failed (${res.status})`);
          return;
        }

        let resultUrl: string | null = null;
        if (data.status === "completed") {
          resultUrl = data.output_url ?? null;
        } else if (data.id) {
          resultUrl = await pollGenerationJob(data.id);
        }

        if (!resultUrl) {
          setGenerateError("Upscale finished without an output URL.");
          return;
        }

        setOutputUrls([resultUrl]);
        setHasUserGenerated(true);
        setHistory((prev) => [
          {
            id: `upscale-${Date.now()}`,
            thumb: resultUrl,
            title: `Upscale ${tier}`,
            subtitle: "Real-ESRGAN",
            outputImageUrl: resultUrl
          },
          ...prev.filter((h) => h.outputImageUrl !== resultUrl)
        ]);
        void refreshCredits();
      } catch (e: unknown) {
        setGenerateError(e instanceof Error ? e.message : "Upscale network error.");
      } finally {
        setLoading(false);
      }
    },
    [loading, outputUrls, refreshCredits, showingModelShowcase]
  );

  const runImageVariations = useCallback(async () => {
    if (!canPostProcessImage) {
      setGenerateError("Generate an image first, then create variations.");
      return;
    }
    const limits = getAtlasImageModelLimits(modelId);
    const variationCount = Math.min(4, limits.maxBatch);
    if (variationCount < 2) {
      setGenerateError(
        "This model does not support batch variations. Switch to Nano Banana, Flux, or Seedream."
      );
      return;
    }
    await runGeneration({
      ...currentGenerateContext,
      batchCount: variationCount
    });
  }, [canPostProcessImage, currentGenerateContext, modelId, runGeneration]);

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
              imageUrls={previewUrls}
              loading={loading}
              errorMessage={generateError}
              referenceThumbUrls={referenceUrls}
              isExample={showingModelShowcase}
              actionTab={actionTab}
              bottomBarHeight={bottomBarHeight}
              canPostProcessImage={canPostProcessImage}
              canRunVariations={canRunVariations}
              postProcessBusy={loading}
              onResetDefaults={resetImageTabDefaults}
              onUpscaleImage={(tier) => void runImageUpscale(tier)}
              onVariations={() => void runImageVariations()}
              className="scrollbar-hide h-full min-h-0 w-full min-w-0 flex-1"
            />
          </div>

          <ImageHistory
            items={historyItems}
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
          appliedShowcaseForModel.current = null;
        }}
        referenceUrls={referenceUrls}
        onReferenceUrlsChange={setReferenceUrlsSafe}
        modelId={modelId}
        onModelChange={(id) => {
          setModelId(id);
          setGenerateError(null);
          appliedShowcaseForModel.current = null;
        }}
        cameraStyle={cameraStyle}
        onCameraStyleChange={setCameraStyle}
        resolution={resolution}
        onResolutionChange={setResolution}
        aspect={aspect}
        onAspectChange={setAspect}
        batchCount={batchCount}
        onBatchCountChange={setBatchCount}
        creditsLine={creditsLine}
        loadingGenerate={loading}
        onGenerate={runGeneration}
        onHeightChange={setBottomBarHeight}
        studioLock={studioLock}
      />
      <InsufficientCreditsModal
        open={insufficientCredits.open}
        required={insufficientCredits.required}
        balance={insufficientCredits.balance}
        onClose={() => setInsufficientCredits(CLOSED_INSUFFICIENT_CREDITS)}
      />
      <AuthRequiredModal
        open={authRequiredOpen}
        onClose={() => setAuthRequiredOpen(false)}
      />
    </div>
  );
}
