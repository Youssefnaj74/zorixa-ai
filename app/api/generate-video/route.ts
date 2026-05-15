import { NextResponse } from "next/server";

import { atlasModelSupportsGenerateAudio } from "@/lib/atlas-video-generate-audio";
import {
  type AtlasVideoRouteAction,
  normalizeAtlasVideoSpeedTier,
  resolveAtlasVideoModelId
} from "@/lib/atlas-video-model-ids";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { env } from "@/lib/env";
import { extractAtlasVideoOutputUrl } from "@/lib/extract-atlas-video-output-url";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";

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
  /** Seedance native soundtrack (Atlas `generate_audio`). */
  generate_audio?: boolean;
  /** UI Standard/Fast → Atlas model slug tier (Seedance fast, Kling std). */
  speed_tier?: string;
  speedTier?: string;
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
  return (
    model === "bytedance/seedance-2.0/image-to-video" ||
    model === "bytedance/seedance-2.0-fast/image-to-video"
  );
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
  outputs?: unknown[];
  output?: unknown;
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
  const videoUrl = extractAtlasVideoOutputUrl(pollJson.data);
  const err =
    pollJson.data?.error ??
    (typeof pollJson.message === "string" ? pollJson.message : null);
  const statusNorm = String(status).toLowerCase();

  return NextResponse.json({
    status,
    video_url: typeof videoUrl === "string" ? videoUrl : null,
    /** Lets the browser parse alternate Atlas shapes if `video_url` is still null. */
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

  const action: GenerateVideoAction = body.action ?? "text";

  const videoModel =
    typeof body.videoModel === "string" ? body.videoModel.trim() : "";
  if (!videoModel) {
    return NextResponse.json({ error: "Missing videoModel" }, { status: 400 });
  }

  const speedTier = normalizeAtlasVideoSpeedTier(body.speed_tier ?? body.speedTier);
  const model = resolveAtlasVideoModelId(videoModel, action, speedTier);
  if (!model) {
    return NextResponse.json(
      { error: `Unknown video model: ${videoModel}` },
      { status: 400 }
    );
  }

  let image_url =
    typeof body.image_url === "string" ? body.image_url.trim() : "";
  let audio_url =
    typeof body.audio_url === "string" ? body.audio_url.trim() : "";
  let video_url =
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

  if (action === "image" && image_url) {
    const c = coerceToPublicHttpsUrl(image_url);
    if (!c) {
      return NextResponse.json(
        {
          error:
            "image_url must be a public https:// URL so Atlas can fetch the image (upload local or data URLs first)."
        },
        { status: 400 }
      );
    }
    image_url = c;
  }
  if (action === "lipsync" && audio_url) {
    const c = coerceToPublicHttpsUrl(audio_url);
    if (!c) {
      return NextResponse.json(
        {
          error:
            "audio_url must be a public https:// URL so Atlas can fetch the audio (upload local files first)."
        },
        { status: 400 }
      );
    }
    audio_url = c;
  }
  if (action === "edit" && video_url) {
    const c = coerceToPublicHttpsUrl(video_url);
    if (!c) {
      return NextResponse.json(
        {
          error:
            "video_url must be a public https:// URL so Atlas can fetch the source video (upload local files first)."
        },
        { status: 400 }
      );
    }
    video_url = c;
  }

  const aspectRatio = normalizeAspectRatio(body.aspectRatio);
  const resolution = normalizeResolution(body.resolution);
  const durationSec = normalizeDurationSeconds(body.duration);

  const fps = 24;

  let atlasBody: Record<string, unknown>;

  const seedance20I2v = isSeedance20ImageToVideo(model) && Boolean(image_url);
  const generateAudio =
    body.generate_audio === true &&
    atlasModelSupportsGenerateAudio(model) &&
    (action === "text" || action === "image");

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
    if (generateAudio) {
      atlasBody.generate_audio = true;
    }
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
    if (generateAudio) {
      atlasBody.generate_audio = true;
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
      durationSec,
      generateAudio,
      speedTier
    });
  }

  console.log(
    "[generate-video] Atlas generateVideo payload — videoModel:",
    videoModel,
    "speedTier:",
    speedTier,
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
    const videoUrl = extractAtlasVideoOutputUrl(createJson.data);
    if (videoUrl) {
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
