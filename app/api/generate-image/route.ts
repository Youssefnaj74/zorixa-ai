import { NextResponse } from "next/server";

import {
  atlasGenerateImageErrorMessage,
  buildAtlasImageBody
} from "@/lib/build-atlas-image-body";
import { logAtlasImageGenerationIfNew } from "@/lib/atlas-image-generation-log";
import {
  getAtlasImageModelLimits,
  isAtlasImageComposerId,
  resolveAtlasImageModelId,
  usesParallelImageBatch
} from "@/lib/atlas-image-model-ids";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  assertCanAfford,
  creditsForImageModel,
  deductCreditsForPrediction,
  insufficientCreditsResponse,
  lookupCreditsSpentForAtlasPrediction
} from "@/lib/credits-charge";
import { env } from "@/lib/env";
import {
  extractAtlasImageOutputUrls,
  extractAtlasVideoOutputUrl
} from "@/lib/extract-atlas-video-output-url";
import { enforceContentPolicy, requestIp } from "@/lib/content-moderation";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";
import { resolveZorixaActor } from "@/lib/zorixa-mcp-auth";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const CLIENT_POLL_HINT_MS = 3000;

type ClientBody = {
  prompt?: string;
  negativePrompt?: string;
  /** Zorixa composer row id (e.g. nano-banana-2). */
  imageModel?: string;
  aspectRatio?: string;
  resolution?: string;
  image_urls?: string[];
  num_images?: number;
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
    imageModelParam && isAtlasImageComposerId(imageModelParam) ? imageModelParam : null;
  const pollPrompt = searchParams.get("prompt")?.trim() || null;
  if (!predictionId) {
    return NextResponse.json(
      { error: "Missing predictionId or prediction_id query parameter" },
      { status: 400 }
    );
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

  if (imageUrls.length > 0) {
    const actor = await resolveZorixaActor(request);
    if (actor) {
      const creditsSpent = await lookupCreditsSpentForAtlasPrediction(actor.userId, predictionId);
      const creditsPerImage =
        creditsSpent > 0 && imageUrls.length > 1
          ? Math.max(1, Math.round(creditsSpent / imageUrls.length))
          : creditsSpent;
      for (const outputUrl of imageUrls) {
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
    return await handleGenerateImagePost(request);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    if (process.env.NODE_ENV === "development") {
      console.error("[generate-image] unhandled", e);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
      return NextResponse.json(
        { error: "Atlas did not return a prediction id", credits_spent: totalCreditsSpent },
        { status: 502 }
      );
    }

    const charge = await deductCreditsForPrediction({
      userId,
      predictionId,
      amount: perImageCredits,
      featureUsed: "enhance"
    });
    if (!charge.ok) {
      if (charge.error === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          {
            ...insufficientCreditsResponse(charge.balance, perImageCredits),
            partial_prediction_ids: predictionIds.length > 0 ? predictionIds : undefined,
            credits_spent: totalCreditsSpent
          },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: "Could not deduct credits" }, { status: 500 });
    }

    totalCreditsSpent += charge.creditsSpent;
    balanceAfter = charge.balanceAfter;
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
          creditsSpent: charge.creditsSpent
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

async function handleGenerateImagePost(request: Request) {
  const apiKey = env.atlasCloudApiKey;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing ATLASCLOUD_API_KEY" },
      { status: 500 }
    );
  }

  let body: ClientBody;
  try {
    body = (await request.json()) as ClientBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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
    return NextResponse.json(
      {
        error: atlasGenerateImageErrorMessage(createJson, createRes.status)
      },
      { status: createRes.status >= 400 ? createRes.status : 502 }
    );
  }

  const predictionId = createJson.data?.id;
  if (!predictionId) {
    return NextResponse.json(
      { error: "Atlas did not return a prediction id" },
      { status: 502 }
    );
  }

  const charge = await deductCreditsForPrediction({
    userId: actor.userId,
    predictionId,
    amount: creditCost,
    featureUsed: "enhance"
  });
  if (!charge.ok) {
    if (charge.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(charge.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Could not deduct credits" }, { status: 500 });
  }

  const creditsSpent = charge.creditsSpent;

  const initialStatus = createJson.data?.status;
  if (initialStatus === "completed" || initialStatus === "succeeded") {
    const imageUrl = extractAtlasVideoOutputUrl(createJson.data);
    if (imageUrl) {
      const actor = await resolveZorixaActor(request);
      if (actor) {
        void logAtlasImageGenerationIfNew({
          userId: actor.userId,
          outputUrl: imageUrl,
          inputUrl: imageUrls[0] ?? null,
          predictionId: predictionId ?? null,
          composerModelId: imageModel,
          prompt,
          requireTerminalStatus: initialStatus,
          creditsSpent
        });
      }
      return NextResponse.json({
        image_url: imageUrl,
        prediction_id: predictionId,
        credits_spent: creditsSpent,
        credits_balance: charge.balanceAfter
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
    credits_balance: charge.balanceAfter
  });
}
