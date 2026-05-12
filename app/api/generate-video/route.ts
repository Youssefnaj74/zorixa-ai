import { NextResponse } from "next/server";

import {
  type AtlasVideoRouteAction,
  resolveAtlasVideoModelId
} from "@/lib/atlas-video-model-ids";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
/** Client polls `GET ?predictionId=` this often (serverless POST cannot block for minutes). */
const CLIENT_POLL_HINT_MS = 3000;

type GenerateVideoAction = AtlasVideoRouteAction;

type ClientBody = {
  prompt?: string;
  action?: GenerateVideoAction;
  /** Zorixa composer row id (e.g. kling-3-pro) — maps to Atlas `model` slug. */
  videoModel?: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  /** UI aspect selector (16:9, 9:16, 1:1, 4:3) — forwarded to Atlas. */
  aspectRatio?: string;
  /** UI resolution tier (480p, 720p, 1080p) — forwarded to Atlas `resolution`. */
  resolution?: string;
  /** Clip length in seconds (clamped). */
  duration?: number;
};

const ALLOWED_ASPECT_RATIOS = new Set(["16:9", "9:16", "1:1", "4:3"]);
const DEFAULT_ASPECT_RATIO = "9:16";

function normalizeAspectRatio(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_ASPECT_RATIO;
  const v = raw.trim();
  return ALLOWED_ASPECT_RATIOS.has(v) ? v : DEFAULT_ASPECT_RATIO;
}

const ALLOWED_RESOLUTIONS = new Set(["480p", "720p", "1080p"]);
const DEFAULT_RESOLUTION = "1080p";

function normalizeResolution(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_RESOLUTION;
  const v = raw.trim().toLowerCase();
  return ALLOWED_RESOLUTIONS.has(v) ? v : DEFAULT_RESOLUTION;
}

function normalizeDurationSeconds(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 5;
  return Math.min(60, Math.max(1, Math.round(raw)));
}

/**
 * Seedance 2.0 I2V on Atlas accepts only flat fields (`image` URL, dimensions, etc.).
 * Sending `content` alongside flat fields causes 400 (verified in Atlas request history).
 */
function isSeedance20ImageToVideo(model: string): boolean {
  return model === "bytedance/seedance-2.0/image-to-video";
}

/** Short-side pixel size from UI resolution tier (matches Seedance model page examples). */
function resolutionShortSidePx(resolution: string): number {
  switch (resolution) {
    case "1080p":
      return 1080;
    case "720p":
      return 720;
    case "480p":
    default:
      return 480;
  }
}

/** Width × height for Seedance I2V (short side = resolution tier). */
function dimensionsForAspectResolution(
  aspectRatio: string,
  resolution: string
): { width: number; height: number } {
  const s = resolutionShortSidePx(resolution);
  switch (aspectRatio) {
    case "16:9":
      return { width: Math.round((s * 16) / 9), height: s };
    case "9:16":
      return { width: s, height: Math.round((s * 16) / 9) };
    case "1:1":
      return { width: s, height: s };
    case "4:3":
      return { width: Math.round((s * 4) / 3), height: s };
    default:
      return { width: s, height: Math.round((s * 16) / 9) };
  }
}

type AtlasPredictionData = {
  id?: string;
  status?: string;
  outputs?: string[];
  error?: string | null;
};

type AtlasEnvelope = {
  data?: AtlasPredictionData;
  message?: string;
};

/** One-shot Atlas prediction fetch (used by GET for browser polling). */
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

/**
 * Poll Atlas prediction status once. Use from the browser in a loop — not from a long-lived POST
 * (Vercel/serverless timeouts would kill the request while Atlas still runs).
 */
export async function GET(request: Request) {
  const apiKey = process.env.ATLASCLOUD_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "Server missing ATLASCLOUD_API_KEY" },
      { status: 500 }
    );
  }

  const predictionId = new URL(request.url).searchParams.get("predictionId")?.trim();
  if (!predictionId) {
    return NextResponse.json({ error: "Missing predictionId query parameter" }, { status: 400 });
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
  const videoUrl = pollJson.data?.outputs?.[0];
  const err =
    pollJson.data?.error ??
    (typeof pollJson.message === "string" ? pollJson.message : null);

  return NextResponse.json({
    status,
    video_url: typeof videoUrl === "string" ? videoUrl : null,
    error: status === "failed" ? err : null,
    poll_interval_ms: CLIENT_POLL_HINT_MS
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.ATLASCLOUD_API_KEY;
  if (!apiKey?.trim()) {
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

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const action: GenerateVideoAction = body.action ?? "text";

  const videoModel =
    typeof body.videoModel === "string" ? body.videoModel.trim() : "";
  if (!videoModel) {
    return NextResponse.json({ error: "Missing videoModel" }, { status: 400 });
  }

  const model = resolveAtlasVideoModelId(videoModel, action);
  if (!model) {
    return NextResponse.json(
      { error: `Unknown video model: ${videoModel}` },
      { status: 400 }
    );
  }

  const image_url =
    typeof body.image_url === "string" ? body.image_url.trim() : "";
  const audio_url =
    typeof body.audio_url === "string" ? body.audio_url.trim() : "";
  const video_url =
    typeof body.video_url === "string" ? body.video_url.trim() : "";

  if (action === "image" && !image_url) {
    return NextResponse.json(
      { error: "Missing image_url for Image to Video" },
      { status: 400 }
    );
  }
  if (action === "lipsync" && !audio_url) {
    return NextResponse.json(
      { error: "Missing audio_url for Lipsyncing" },
      { status: 400 }
    );
  }
  if (action === "edit" && !video_url) {
    return NextResponse.json(
      { error: "Missing video_url for Video Edit" },
      { status: 400 }
    );
  }

  const aspectRatio = normalizeAspectRatio(body.aspectRatio);
  const resolution = normalizeResolution(body.resolution);
  const durationSec = normalizeDurationSeconds(body.duration);

  const fps = 24;

  let atlasBody: Record<string, unknown>;

  const seedance20I2v = isSeedance20ImageToVideo(model) && Boolean(image_url);

  if (seedance20I2v) {
    const { width, height } = dimensionsForAspectResolution(aspectRatio, resolution);
    atlasBody = {
      model,
      prompt,
      image: image_url,
      width,
      height,
      duration: durationSec,
      fps
    };
  } else {
    // Atlas `generateVideo` flat body (Kling, Veo, Wan, Hailuo, Seedance T2V, etc.).
    atlasBody = {
      model,
      prompt,
      duration: durationSec,
      fps,
      aspect_ratio: aspectRatio,
      aspectRatio,
      resolution
    };
    if (image_url) {
      atlasBody.image_url = image_url;
      atlasBody.image = image_url;
    }
    if (audio_url) {
      atlasBody.audio_url = audio_url;
      atlasBody.audio = audio_url;
    }
    if (video_url) {
      atlasBody.video_url = video_url;
      atlasBody.video = video_url;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[generate-video] Atlas request", {
      videoModel,
      action,
      model,
      envelope: seedance20I2v ? "seedance-2.0-i2v-flat" : "flat",
      aspectRatio,
      resolution,
      keys: Object.keys(atlasBody),
      promptLen: prompt.length,
      durationSec
    });
  }

  console.log(
    "[generate-video] Atlas generateVideo payload — videoModel:",
    videoModel,
    "→ model:",
    model,
    "| envelope:",
    seedance20I2v ? "seedance-2.0-i2v-flat" : "flat",
    "| resolution:",
    resolution
  );

  const createRes = await fetch(`${ATLAS_BASE}/generateVideo`, {
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
          `Atlas generateVideo failed (${createRes.status})`
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
    const videoUrl = createJson.data?.outputs?.[0];
    if (typeof videoUrl === "string" && videoUrl.length > 0) {
      return NextResponse.json({ video_url: videoUrl });
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
