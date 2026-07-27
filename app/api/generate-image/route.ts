import { NextResponse } from "next/server";

import {
  atlasGenerateImageErrorMessage,
  buildAtlasImageBody
} from "@/lib/build-atlas-image-body";
import {
  ATLAS_IMAGE_UPSCALER_COMPOSER_ID,
  buildAtlasImageUpscalerBody,
  isAtlasImageUpscalerComposerId,
  normalizeAtlasImageUpscalerOutscale
} from "@/lib/atlas-image-upscaler";
import { logAtlasImageGenerationIfNew } from "@/lib/atlas-image-generation-log";
import {
  getAtlasImageModelLimits,
  isAtlasImageComposerId,
  resolveAtlasImageModelId,
  usesParallelImageBatch
} from "@/lib/atlas-image-model-ids";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  abortAtlasCharge,
  assertCanAfford,
  beginAtlasCharge,
  completeAtlasCharge,
  creditsForImageModel,
  insufficientCreditsResponse,
  lookupCreditsSpentForAtlasPrediction,
  userOwnsAtlasPrediction
} from "@/lib/credits-charge";
import { env } from "@/lib/env";
import {
  extractAtlasImageOutputUrls,
  extractAtlasVideoOutputUrl
} from "@/lib/extract-atlas-video-output-url";
import {
  enforceContentPolicy,
  enforceMediaContentPolicy,
  requestIp
} from "@/lib/content-moderation";
import { rateLimitResponse } from "@/lib/rate-limit";
import { captureException } from "@/lib/report-error";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";
import { resolveZorixaActor, unauthorizedApiResponse } from "@/lib/zorixa-mcp-auth";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const CLIENT_POLL_HINT_MS = 3000;
/** Vercel hobby default is 10s — allow Atlas create + credit finalize. */
export const maxDuration = 60;

const ATLAS_UPSCALE_CREATE_TIMEOUT_MS = 55_000;

type ClientBody = {
  action?: string;
  prompt?: string;
  negativePrompt?: string;
  /** Zorixa composer row id (e.g. nano-banana-2). */
  imageModel?: string;
  aspectRatio?: string;
  resolution?: string;
  image_urls?: string[];
  num_images?: number;
  /** Image upscaler — public https image URL. */
  image_url?: string;
  outscale?: number;
};

const ALLOWED_ASPECT_RATIOS = new Set([
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
  "4:5",
  "5:4",
  "21:9"
]);

function normalizeAspectRatio(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().replace(/\uFF1A/g, ":").replace(/\s+/g, "");
  if (!v || v.toLowerCase() === "auto") return null;
  return ALLOWED_ASPECT_RATIOS.has(v) ? v : null;
}

function normalizeNumImages(raw: unknown, imageModel: string): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 1;
  const max = getAtlasImageModelLimits(imageModel).maxBatch;
  const n = Math.min(max, Math.max(1, Math.round(raw)));
  if (imageModel === "gpt-image-2") return 1;
  return n;
}

type AtlasPredictionData = {
  id?: string;
  status?: string;
  outputs?: unknown[];
  output?: unknown;
  error?: string | null;
};

type AtlasEnvelope = {
  data?: AtlasPredictionData;
  message?: string;
};

async function fetchAtlasPredictionOnce(
  predictionId: string,
  apiKey: string
): Promise<AtlasEnvelope & { httpOk: boolean; httpStatus: number }> {
  const pollRes = await fetch(`${ATLAS_BASE}/prediction/${predictionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store"
  });
  const pollJson = (await pollRes.json()) as AtlasEnvelope;
  return { ...pollJson, httpOk: pollRes.ok, httpStatus: pollRes.status };
}

export async function GET(request: Request) {
  const actor = await resolveZorixaActor(request);
  if (!actor) {
    return unauthorizedApiResponse();
  }

  const pollLimited = await rateLimitResponse({
    key: `generate-image-poll:${actor.userId}`,
    limit: 120,
    windowMs: 60_000,
    message: "Too many status checks. Wait a moment and try again."
  });
  if (pollLimited) return pollLimited;

  const apiKey = env.atlasCloudApiKey;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing ATLASCLOUD_API_KEY" },
      { status: 500 }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const predictionId = (searchParams.get("predictionId") ?? searchParams.get("prediction_id"))?.trim();
  const imageModelParam = searchParams.get("imageModel")?.trim() ?? "";
  const composerModelId =
    imageModelParam &&
    (isAtlasImageComposerId(imageModelParam) || isAtlasImageUpscalerComposerId(imageModelParam))
      ? imageModelParam
      : null;
  const pollPrompt = searchParams.get("prompt")?.trim() || null;
  if (!predictionId) {
    return NextResponse.json(
      { error: "Missing predictionId or prediction_id query parameter" },
      { status: 400 }
    );
  }

  const owns = await userOwnsAtlasPrediction(actor.userId, predictionId);
  if (!owns) {
    return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
  }

  const pollJson = await fetchAtlasPredictionOnce(predictionId, apiKey);
  if (!pollJson.httpOk) {
    return NextResponse.json(
      {
        error: pollJson.message ?? `Prediction poll failed (${pollJson.httpStatus})`,
        poll_interval_ms: CLIENT_POLL_HINT_MS
      },
      { status: pollJson.httpStatus >= 400 ? pollJson.httpStatus : 502 }
    );
  }

  const status = pollJson.data?.status ?? "unknown";
  const imageUrls = extractAtlasImageOutputUrls(pollJson.data);
  const imageUrl = imageUrls[0] ?? extractAtlasVideoOutputUrl(pollJson.data);
  const err =
    pollJson.data?.error ??
    (typeof pollJson.message === "string" ? pollJson.message : null);
  const statusNorm = String(status).toLowerCase();

  const urlsToLog =
    imageUrls.length > 0
      ? imageUrls
      : typeof imageUrl === "string" && imageUrl.trim().length > 0
        ? [imageUrl.trim()]
        : [];

  if (urlsToLog.length > 0) {
    const creditsSpent = await lookupCreditsSpentForAtlasPrediction(actor.userId, predictionId);
    const creditsPerImage =
      creditsSpent > 0 && urlsToLog.length > 1
        ? Math.max(1, Math.round(creditsSpent / urlsToLog.length))
        : creditsSpent;
    for (const outputUrl of urlsToLog) {
      void logAtlasImageGenerationIfNew({
        userId: actor.userId,
        outputUrl,
        predictionId,
        composerModelId,
        prompt: pollPrompt,
        requireTerminalStatus: status,
        creditsSpent: creditsPerImage
      });
    }
  }

  return NextResponse.json({
    status,
    image_url: typeof imageUrl === "string" ? imageUrl : null,
    image_urls: imageUrls.length > 0 ? imageUrls : null,
    outputs: pollJson.data?.outputs ?? null,
    output: pollJson.data?.output ?? null,
    error: statusNorm === "failed" ? err : null,
    poll_interval_ms: CLIENT_POLL_HINT_MS
  });
}

export async function POST(request: Request) {
  try {
    const actorForLimit = await resolveZorixaActor(request);
    const ip = requestIp(request);
    const limited = await rateLimitResponse({
      key: `generate-image:${actorForLimit?.userId ?? ip}`,
      limit: 24,
      windowMs: 60_000,
      message: "Too many image generations. Please wait a minute and try again."
    });
    if (limited) return limited;

    let body: ClientBody;
    try {
      body = (await request.json()) as ClientBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.action === "upscale") {
      return await handleImageUpscalePost(body, request);
    }

    return await handleGenerateImagePost(request, body);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    captureException(e, { route: "/api/generate-image" });
    if (process.env.NODE_ENV === "development") {
      console.error("[generate-image] unhandled", e);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleImageUpscalePost(body: ClientBody, request: Request) {
  const apiKey = env.atlasCloudApiKey;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing ATLASCLOUD_API_KEY" },
      { status: 500 }
    );
  }

  const upscalePrompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const actorEarly = await resolveZorixaActor(request);
  if (upscalePrompt) {
    const policyBlock = await enforceContentPolicy({
      userId: actorEarly?.userId ?? null,
      workflow: "image_upscale",
      route: "/api/generate-image",
      texts: [upscalePrompt],
      ip: requestIp(request),
      metadata: { action: "upscale" }
    });
    if (policyBlock) return policyBlock;
  }

  const rawImage = typeof body.image_url === "string" ? body.image_url.trim() : "";
  const imageUrl = coerceToPublicHttpsUrl(rawImage);
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing public https:// image URL to upscale." },
      { status: 400 }
    );
  }

  const mediaBlock = await enforceMediaContentPolicy({
    userId: actorEarly?.userId ?? null,
    workflow: "image_upscale",
    route: "/api/generate-image",
    media: [{ url: imageUrl, kind: "image" }],
    ip: requestIp(request),
    metadata: { action: "upscale", stage: "input_media" }
  });
  if (mediaBlock) return mediaBlock;

  const outscale = normalizeAtlasImageUpscalerOutscale(body.outscale);
  const actor = actorEarly;
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creditCost = creditsForImageModel(ATLAS_IMAGE_UPSCALER_COMPOSER_ID, 1);
  const afford = await assertCanAfford(actor.userId, creditCost);
  if (!afford.ok) {
    if (afford.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(afford.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const atlasBody = buildAtlasImageUpscalerBody({ imageUrl, outscale });

  const chargeBegin = await beginAtlasCharge({
    userId: actor.userId,
    amount: creditCost,
    featureUsed: "enhance"
  });
  if (!chargeBegin.ok) {
    if (chargeBegin.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(chargeBegin.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Could not deduct credits" }, { status: 500 });
  }

  let createRes: Response;
  try {
    createRes = await fetch(`${ATLAS_BASE}/generateImage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(atlasBody),
      signal: AbortSignal.timeout(ATLAS_UPSCALE_CREATE_TIMEOUT_MS)
    });
  } catch (e) {
    await abortAtlasCharge({ userId: actor.userId, session: chargeBegin.session });
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    return NextResponse.json(
      {
        error: timedOut
          ? "Atlas image upscaler timed out. Try again in a moment."
          : "Could not reach Atlas image upscaler. Try again."
      },
      { status: 504 }
    );
  }

  const createJson = (await createRes.json()) as AtlasEnvelope;
  if (!createRes.ok) {
    await abortAtlasCharge({ userId: actor.userId, session: chargeBegin.session });
    return NextResponse.json(
      {
        error:
          createJson.message ?? `Atlas image upscaler failed (${createRes.status})`,
        atlas_error: createJson.data?.error ?? createJson.message ?? null
      },
      { status: createRes.status >= 400 ? createRes.status : 502 }
    );
  }

  const predictionId = createJson.data?.id;
  if (!predictionId) {
    await abortAtlasCharge({ userId: actor.userId, session: chargeBegin.session });
    return NextResponse.json({ error: "Atlas did not return a prediction id" }, { status: 502 });
  }

  const finalized = await completeAtlasCharge({
    userId: actor.userId,
    session: chargeBegin.session,
    predictionId
  });
  if (!finalized.ok) {
    await abortAtlasCharge({ userId: actor.userId, session: chargeBegin.session });
    return NextResponse.json({ error: "Could not finalize credit charge" }, { status: 500 });
  }

  const creditsSpent = chargeBegin.session.creditsSpent;
  const balanceAfter = chargeBegin.session.balanceAfter;
  const initialStatus = createJson.data?.status;
  const statusNorm = String(initialStatus ?? "").toLowerCase();

  if (statusNorm === "completed" || statusNorm === "succeeded") {
    const urls = extractAtlasImageOutputUrls(createJson.data);
    const imageOut = urls[0] ?? extractAtlasVideoOutputUrl(createJson.data);
    if (imageOut) {
      void logAtlasImageGenerationIfNew({
        userId: actor.userId,
        outputUrl: imageOut,
        inputUrl: imageUrl,
        predictionId,
        composerModelId: ATLAS_IMAGE_UPSCALER_COMPOSER_ID,
        requireTerminalStatus: initialStatus,
        creditsSpent
      });
      return NextResponse.json({
        image_url: imageOut,
        image_urls: urls.length > 0 ? urls : [imageOut],
        prediction_id: predictionId,
        credits_spent: creditsSpent,
        credits_balance: balanceAfter
      });
    }
    return NextResponse.json(
      { error: "Atlas returned completed without an output URL" },
      { status: 502 }
    );
  }

  if (statusNorm === "failed") {
    const err =
      createJson.data?.error ?? createJson.message ?? "Atlas image upscaler failed";
    return NextResponse.json({ error: err }, { status: 502 });
  }

  return NextResponse.json({
    pending: true,
    prediction_id: predictionId,
    poll_interval_ms: CLIENT_POLL_HINT_MS,
    credits_spent: creditsSpent,
    credits_balance: balanceAfter
  });
}

async function handleParallelImageBatchPost(args: {
  apiKey: string;
  userId: string;
  imageModel: string;
  model: string;
  prompt: string;
  isEdit: boolean;
  imageUrls: string[];
  aspectRatio: string | null;
  resolution: string;
  numImages: number;
  negativePrompt: string;
}): Promise<NextResponse> {
  const {
    apiKey,
    userId,
    imageModel,
    model,
    prompt,
    isEdit,
    imageUrls,
    aspectRatio,
    resolution,
    numImages,
    negativePrompt
  } = args;

  const perImageCredits = creditsForImageModel(imageModel, 1, { resolution, isEdit });
  const predictionIds: string[] = [];
  const immediateUrls: string[] = [];
  let totalCreditsSpent = 0;
  let balanceAfter = 0;

  for (let i = 0; i < numImages; i++) {
    const perCharge = await beginAtlasCharge({
      userId,
      amount: perImageCredits,
      featureUsed: "enhance"
    });
    if (!perCharge.ok) {
      if (perCharge.error === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          {
            ...insufficientCreditsResponse(perCharge.balance, perImageCredits),
            partial_prediction_ids: predictionIds.length > 0 ? predictionIds : undefined,
            credits_spent: totalCreditsSpent
          },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: "Could not deduct credits" }, { status: 500 });
    }

    const atlasBody = buildAtlasImageBody({
      model,
      prompt,
      isEdit,
      imageUrls,
      aspectRatio,
      resolution,
      numImages: 1,
      negativePrompt
    });

    const createRes = await fetch(`${ATLAS_BASE}/generateImage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(atlasBody)
    });

    const createJson = (await createRes.json()) as AtlasEnvelope;
    if (!createRes.ok) {
      await abortAtlasCharge({ userId, session: perCharge.session });
      return NextResponse.json(
        {
          error: atlasGenerateImageErrorMessage(createJson, createRes.status),
          partial_prediction_ids: predictionIds.length > 0 ? predictionIds : undefined,
          credits_spent: totalCreditsSpent
        },
        { status: createRes.status >= 400 ? createRes.status : 502 }
      );
    }

    const predictionId = createJson.data?.id;
    if (!predictionId) {
      await abortAtlasCharge({ userId, session: perCharge.session });
      return NextResponse.json(
        { error: "Atlas did not return a prediction id", credits_spent: totalCreditsSpent },
        { status: 502 }
      );
    }

    const finalized = await completeAtlasCharge({
      userId,
      session: perCharge.session,
      predictionId
    });
    if (!finalized.ok) {
      await abortAtlasCharge({ userId, session: perCharge.session });
      return NextResponse.json({ error: "Could not finalize credit charge" }, { status: 500 });
    }

    totalCreditsSpent += perCharge.session.creditsSpent;
    balanceAfter = perCharge.session.balanceAfter;
    predictionIds.push(predictionId);

    const initialStatus = createJson.data?.status;
    if (initialStatus === "completed" || initialStatus === "succeeded") {
      const urls = extractAtlasImageOutputUrls(createJson.data);
      const url = urls[0] ?? extractAtlasVideoOutputUrl(createJson.data);
      if (url) {
        immediateUrls.push(url);
        void logAtlasImageGenerationIfNew({
          userId,
          outputUrl: url,
          inputUrl: imageUrls[0] ?? null,
          predictionId,
          composerModelId: imageModel,
          prompt,
          requireTerminalStatus: initialStatus,
          creditsSpent: perCharge.session.creditsSpent
        });
      }
    }
  }

  const allReady = immediateUrls.length >= numImages;

  return NextResponse.json({
    batch: true,
    pending: !allReady,
    prediction_ids: predictionIds,
    prediction_id: predictionIds[0] ?? null,
    image_url: immediateUrls[0] ?? null,
    image_urls: immediateUrls.length > 0 ? immediateUrls : null,
    poll_interval_ms: CLIENT_POLL_HINT_MS,
    credits_spent: totalCreditsSpent,
    credits_balance: balanceAfter
  });
}

async function handleGenerateImagePost(request: Request, body: ClientBody) {
  const apiKey = env.atlasCloudApiKey;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing ATLASCLOUD_API_KEY" },
      { status: 500 }
    );
  }

  const prompt = stripVideoComposerAssetTokens(
    typeof body.prompt === "string" ? body.prompt.trim() : ""
  );
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const negativePromptEarly =
    typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : "";

  const actorEarly = await resolveZorixaActor(request);
  const policyBlock = await enforceContentPolicy({
    userId: actorEarly?.userId ?? null,
    workflow: "image_generation",
    route: "/api/generate-image",
    texts: [prompt, negativePromptEarly],
    ip: requestIp(request),
    metadata: { imageModel: body.imageModel ?? null }
  });
  if (policyBlock) return policyBlock;

  const imageModel =
    typeof body.imageModel === "string" ? body.imageModel.trim() : "";
  if (!imageModel) {
    return NextResponse.json({ error: "Missing imageModel" }, { status: 400 });
  }
  if (!isAtlasImageComposerId(imageModel)) {
    return NextResponse.json(
      { error: `Unknown image model: ${imageModel}` },
      { status: 400 }
    );
  }

  const rawUrls = Array.isArray(body.image_urls) ? body.image_urls : [];
  const imageUrls: string[] = [];
  for (const raw of rawUrls) {
    if (typeof raw !== "string") continue;
    const c = coerceToPublicHttpsUrl(raw.trim());
    if (!c) {
      return NextResponse.json(
        {
          error:
            "Each reference image must be a public https:// URL (upload local or blob URLs first)."
        },
        { status: 400 }
      );
    }
    imageUrls.push(c);
  }

  if (imageUrls.length > 0) {
    const mediaBlock = await enforceMediaContentPolicy({
      userId: actorEarly?.userId ?? null,
      workflow: "image_generation",
      route: "/api/generate-image",
      media: imageUrls.map((url) => ({ url, kind: "image" as const })),
      ip: requestIp(request),
      metadata: { imageModel, stage: "reference_images" }
    });
    if (mediaBlock) return mediaBlock;
  }

  const model = resolveAtlasImageModelId(imageModel, imageUrls.length > 0);
  if (!model) {
    return NextResponse.json(
      { error: `Unknown image model: ${imageModel}` },
      { status: 400 }
    );
  }

  const isEdit = imageUrls.length > 0;

  const aspectRatio = normalizeAspectRatio(body.aspectRatio);
  const resolution =
    typeof body.resolution === "string" ? body.resolution.trim() : "";
  const numImages = normalizeNumImages(body.num_images, imageModel);

  const actor = await resolveZorixaActor(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creditCost = creditsForImageModel(imageModel, numImages, { resolution, isEdit });
  const afford = await assertCanAfford(actor.userId, creditCost);
  if (!afford.ok) {
    if (afford.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(afford.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const negativePrompt =
    typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : "";

  if (usesParallelImageBatch(imageModel, numImages)) {
    return handleParallelImageBatchPost({
      apiKey,
      userId: actor.userId,
      imageModel,
      model,
      prompt,
      isEdit,
      imageUrls,
      aspectRatio,
      resolution,
      numImages,
      negativePrompt
    });
  }

  const atlasBody = buildAtlasImageBody({
    model,
    prompt,
    isEdit,
    imageUrls,
    aspectRatio,
    resolution,
    numImages,
    negativePrompt
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[generate-image] Atlas request", {
      imageModel,
      model,
      isEdit,
      refCount: imageUrls.length,
      aspectRatio,
      resolution,
      numImages,
      keys: Object.keys(atlasBody),
      promptLen: prompt.length
    });
  }

  const chargeBegin = await beginAtlasCharge({
    userId: actor.userId,
    amount: creditCost,
    featureUsed: "enhance"
  });
  if (!chargeBegin.ok) {
    if (chargeBegin.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(chargeBegin.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Could not deduct credits" }, { status: 500 });
  }

  const createRes = await fetch(`${ATLAS_BASE}/generateImage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(atlasBody)
  });

  const createJson = (await createRes.json()) as AtlasEnvelope;
  if (!createRes.ok) {
    await abortAtlasCharge({ userId: actor.userId, session: chargeBegin.session });
    return NextResponse.json(
      {
        error: atlasGenerateImageErrorMessage(createJson, createRes.status)
      },
      { status: createRes.status >= 400 ? createRes.status : 502 }
    );
  }

  const predictionId = createJson.data?.id;
  if (!predictionId) {
    await abortAtlasCharge({ userId: actor.userId, session: chargeBegin.session });
    return NextResponse.json(
      { error: "Atlas did not return a prediction id" },
      { status: 502 }
    );
  }

  const finalized = await completeAtlasCharge({
    userId: actor.userId,
    session: chargeBegin.session,
    predictionId
  });
  if (!finalized.ok) {
    await abortAtlasCharge({ userId: actor.userId, session: chargeBegin.session });
    return NextResponse.json({ error: "Could not finalize credit charge" }, { status: 500 });
  }

  const creditsSpent = chargeBegin.session.creditsSpent;
  const balanceAfter = chargeBegin.session.balanceAfter;

  const initialStatus = createJson.data?.status;
  if (initialStatus === "completed" || initialStatus === "succeeded") {
    const imageUrls = extractAtlasImageOutputUrls(createJson.data);
    const imageUrl = imageUrls[0] ?? extractAtlasVideoOutputUrl(createJson.data);
    if (imageUrl) {
      const actor = await resolveZorixaActor(request);
      if (actor) {
        const creditsPerImage =
          imageUrls.length > 1
            ? Math.max(1, Math.round(creditsSpent / imageUrls.length))
            : creditsSpent;
        for (const outputUrl of imageUrls.length > 0 ? imageUrls : [imageUrl]) {
          void logAtlasImageGenerationIfNew({
            userId: actor.userId,
            outputUrl,
            inputUrl: imageUrls[0] ?? null,
            predictionId: predictionId ?? null,
            composerModelId: imageModel,
            prompt,
            requireTerminalStatus: initialStatus,
            creditsSpent: creditsPerImage
          });
        }
      }
      return NextResponse.json({
        image_url: imageUrl,
        image_urls: imageUrls.length > 0 ? imageUrls : [imageUrl],
        prediction_id: predictionId,
        credits_spent: creditsSpent,
        credits_balance: balanceAfter
      });
    }
    return NextResponse.json(
      { error: "Atlas returned completed without an output URL" },
      { status: 502 }
    );
  }

  if (initialStatus === "failed") {
    const err =
      createJson.data?.error ??
      createJson.message ??
      "Atlas prediction failed";
    return NextResponse.json({ error: err }, { status: 502 });
  }

  return NextResponse.json({
    pending: true,
    prediction_id: predictionId,
    poll_interval_ms: CLIENT_POLL_HINT_MS,
    credits_spent: creditsSpent,
    credits_balance: balanceAfter
  });
}
