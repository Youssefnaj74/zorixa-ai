import { NextResponse } from "next/server";

import { logAtlasImageGenerationIfNew } from "@/lib/atlas-image-generation-log";
import {
  isAtlasImageComposerId,
  resolveAtlasImageModelId
} from "@/lib/atlas-image-model-ids";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { env } from "@/lib/env";
import { extractAtlasVideoOutputUrl } from "@/lib/extract-atlas-video-output-url";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const v = raw.trim();
  if (!v || v.toLowerCase() === "auto") return null;
  return ALLOWED_ASPECT_RATIOS.has(v) ? v : null;
}

function resolutionShortSidePx(resolution: string): number {
  switch (resolution.trim().toUpperCase()) {
    case "4K":
      return 2048;
    case "2K":
      return 1536;
    case "1K":
    default:
      return 1024;
  }
}

/** Qwen Image uses `size` as `width*height` (512–2048), not `aspect_ratio`. */
function qwenSizeFromAspectAndResolution(
  aspectRatio: string | null,
  resolution: string
): string {
  const s = Math.min(2048, Math.max(512, resolutionShortSidePx(resolution)));
  const aspect = aspectRatio ?? "1:1";
  let width: number;
  let height: number;
  switch (aspect) {
    case "16:9":
      height = s;
      width = Math.round((s * 16) / 9);
      break;
    case "9:16":
      width = s;
      height = Math.round((s * 16) / 9);
      break;
    case "4:3":
      height = s;
      width = Math.round((s * 4) / 3);
      break;
    case "3:4":
      width = s;
      height = Math.round((s * 4) / 3);
      break;
    case "1:1":
    default:
      width = s;
      height = s;
      break;
  }
  width = Math.min(2048, Math.max(512, width));
  height = Math.min(2048, Math.max(512, height));
  return `${width}*${height}`;
}

function isQwenImageAtlasModel(model: string): boolean {
  return model.includes("qwen-image");
}

function mapResolutionToSize(resolution: string): string | undefined {
  return qwenSizeFromAspectAndResolution("1:1", resolution);
}

function mapResolutionToMediaResolution(resolution: string): string | undefined {
  switch (resolution.trim().toUpperCase()) {
    case "4K":
      return "high";
    case "2K":
      return "medium";
    case "1K":
      return "low";
    default:
      return undefined;
  }
}

function normalizeNumImages(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 1;
  return Math.min(16, Math.max(1, Math.round(raw)));
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
  const imageUrl = extractAtlasVideoOutputUrl(pollJson.data);
  const err =
    pollJson.data?.error ??
    (typeof pollJson.message === "string" ? pollJson.message : null);
  const statusNorm = String(status).toLowerCase();

  if (typeof imageUrl === "string" && imageUrl.trim().length > 0) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      void logAtlasImageGenerationIfNew({
        userId: user.id,
        outputUrl: imageUrl,
        predictionId,
        requireTerminalStatus: statusNorm
      });
    }
  }

  return NextResponse.json({
    status,
    image_url: typeof imageUrl === "string" ? imageUrl : null,
    outputs: pollJson.data?.outputs ?? null,
    output: pollJson.data?.output ?? null,
    error: statusNorm === "failed" ? err : null,
    poll_interval_ms: CLIENT_POLL_HINT_MS
  });
}

export async function POST(request: Request) {
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
  const numImages = normalizeNumImages(body.num_images);

  const negativePrompt =
    typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : "";

  const qwen = isQwenImageAtlasModel(model);

  const atlasBody: Record<string, unknown> = {
    model,
    prompt
  };

  if (qwen) {
    atlasBody.size = qwenSizeFromAspectAndResolution(
      aspectRatio,
      resolution || "1K"
    );
    if (isEdit && imageUrls[0]) {
      atlasBody.image = imageUrls[0];
    }
  } else {
    const size = resolution ? mapResolutionToSize(resolution) : undefined;
    const mediaResolution = resolution
      ? mapResolutionToMediaResolution(resolution)
      : undefined;

    if (negativePrompt) {
      atlasBody.negative_prompt = negativePrompt;
    }
    if (aspectRatio) {
      atlasBody.aspect_ratio = aspectRatio;
      atlasBody.aspectRatio = aspectRatio;
    }
    if (size) {
      atlasBody.size = size;
    }
    if (mediaResolution) {
      atlasBody.media_resolution = mediaResolution;
    }
    if (numImages > 1) {
      atlasBody.n = numImages;
      atlasBody.num_images = numImages;
    }

    if (isEdit) {
      atlasBody.images = imageUrls;
      atlasBody.image = imageUrls[0];
      atlasBody.image_url = imageUrls[0];
    }
  }

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
      "Content-Type": "application/json"
    },
    body: JSON.stringify(atlasBody)
  });

  const createJson = (await createRes.json()) as AtlasEnvelope;
  if (!createRes.ok) {
    return NextResponse.json(
      {
        error:
          createJson.message ??
          `Atlas generateImage failed (${createRes.status})`
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

  const initialStatus = createJson.data?.status;
  if (initialStatus === "completed" || initialStatus === "succeeded") {
    const imageUrl = extractAtlasVideoOutputUrl(createJson.data);
    if (imageUrl) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        void logAtlasImageGenerationIfNew({
          userId: user.id,
          outputUrl: imageUrl,
          inputUrl: imageUrls[0] ?? null,
          predictionId: predictionId ?? null,
          requireTerminalStatus: initialStatus
        });
      }
      return NextResponse.json({ image_url: imageUrl, prediction_id: predictionId });
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
    poll_interval_ms: CLIENT_POLL_HINT_MS
  });
}
