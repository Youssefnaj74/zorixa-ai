import { NextResponse } from "next/server";

import { AtlasApiError, fetchAtlasPrediction } from "@/lib/atlas-api";
import {
  applyAtlasNativeAudioFields,
  atlasModelSupportsGenerateAudio,
  isAtlasKlingModelSlug,
  normalizeAtlasKlingDurationSeconds
} from "@/lib/atlas-video-generate-audio";
import {
  type AtlasVideoRouteAction,
  normalizeAtlasVideoSpeedTier,
  resolveAtlasVideoModelId
} from "@/lib/atlas-video-model-ids";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { env } from "@/lib/env";
import { extractAtlasVideoOutputUrl } from "@/lib/extract-atlas-video-output-url";
import { formatAtlasVideoFailureForUi } from "@/lib/atlas-video-failure-message";
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
  /** Native soundtrack via Atlas `generate_audio` (Seedance, Kling v3, etc.). */
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
 * Seedance on Atlas uses explicit `width` / `height` (see Atlas model docs).
 * `aspect_ratio` + `resolution` alone are ignored → defaults to landscape (~16:9).
 */
function atlasSeedanceModelUsesDimensions(model: string): boolean {
  return /seedance/i.test(model);
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

/** Atlas video models expect dimensions aligned to 8px (avoids 500/invalid size). */
function snapVideoDimension(n: number): number {
  return Math.max(64, Math.round(n / 8) * 8);
}

/** Width × height for Seedance (short side = resolution tier). */
function dimensionsForAspectResolution(
  aspectRatio: string,
  resolution: string
): { width: number; height: number } {
  const s = resolutionShortSidePx(resolution);
  let width: number;
  let height: number;
  switch (aspectRatio) {
    case "16:9":
      width = Math.round((s * 16) / 9);
      height = s;
      break;
    case "9:16":
      width = s;
      height = Math.round((s * 16) / 9);
      break;
    case "1:1":
      width = s;
      height = s;
      break;
    case "4:3":
      width = Math.round((s * 4) / 3);
      height = s;
      break;
    default:
      width = s;
      height = Math.round((s * 16) / 9);
  }
  return { width: snapVideoDimension(width), height: snapVideoDimension(height) };
}

/** Log if pixel box does not match the UI aspect label (catches 9:16 sent as landscape). */
function warnIfSeedanceDimensionsMismatch(
  aspectRatio: string,
  width: number,
  height: number
): void {
  if (aspectRatio === "9:16" && width >= height) {
    console.error("[generate-video] 9:16 selected but width >= height", { width, height });
  }
  if (aspectRatio === "16:9" && width <= height) {
    console.error("[generate-video] 16:9 selected but width <= height", { width, height });
  }
}

type AtlasEnvelope = {
  data?: {
    id?: string;
    status?: string;
    outputs?: unknown[];
    output?: unknown;
    error?: string | null;
  };
  message?: string;
};

/**
 * Poll Atlas prediction status once. Use from the browser in a loop — not from a long-lived POST
 * (Vercel/serverless timeouts would kill the request while Atlas still runs).
 */
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const predictionId = (searchParams.get("predictionId") ?? searchParams.get("prediction_id"))?.trim();
  const pollGenerateAudio =
    searchParams.get("generate_audio") === "1" ||
    searchParams.get("generateAudio") === "true";
  if (!predictionId) {
    return NextResponse.json(
      { error: "Missing predictionId or prediction_id query parameter" },
      { status: 400 }
    );
  }

  try {
    const poll = await fetchAtlasPrediction(predictionId);
    const statusNorm = poll.status.toLowerCase();

    if (statusNorm === "failed") {
      console.error("[generate-video GET] Atlas task failed", {
        predictionId,
        atlasError: poll.error,
        generateAudio: pollGenerateAudio
      });
    }

    return NextResponse.json({
      status: poll.status,
      video_url: poll.outputUrl,
      outputs: null,
      output: null,
      error:
        statusNorm === "failed"
          ? formatAtlasVideoFailureForUi(poll.error, {
              generateAudio: pollGenerateAudio,
              hostIsProduction: process.env.VERCEL_ENV === "production"
            })
          : null,
      atlas_error: statusNorm === "failed" ? poll.error : null,
      prediction_id: predictionId,
      poll_interval_ms: CLIENT_POLL_HINT_MS
    });
  } catch (e) {
    const msg =
      e instanceof AtlasApiError
        ? e.message
        : e instanceof Error
          ? e.message
          : "Prediction poll failed";

    if (msg.includes("ATLASCLOUD_API_KEY") || msg.includes("Missing ATLASCLOUD")) {
      return NextResponse.json(
        { error: "Server missing ATLASCLOUD_API_KEY in environment" },
        { status: 503 }
      );
    }

    console.error("[generate-video GET] poll error", { predictionId, msg });

    /** 200 + failed — UI shows Atlas error without red 500 spam in console. */
    return NextResponse.json({
      status: "failed",
      video_url: null,
      outputs: null,
      output: null,
      error: msg,
      poll_interval_ms: CLIENT_POLL_HINT_MS
    });
  }
}

export async function POST(request: Request) {
  try {
    return await handleGenerateVideoPost(request);
  } catch (e) {
    console.error("[generate-video POST] unhandled", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Video generation failed" },
      { status: 500 }
    );
  }
}

async function handleGenerateVideoPost(request: Request) {
  const apiKey = env.atlasCloudApiKey;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing ATLASCLOUD_API_KEY in environment" },
      { status: 503 }
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
  let durationSec = normalizeDurationSeconds(body.duration);

  const fps = 24;

  let atlasBody: Record<string, unknown>;

  if (isAtlasKlingModelSlug(model)) {
    durationSec = normalizeAtlasKlingDurationSeconds(durationSec);
  }

  const seedanceDimensions = atlasSeedanceModelUsesDimensions(model);
  const generateAudio =
    body.generate_audio === true &&
    atlasModelSupportsGenerateAudio(model) &&
    (action === "text" || action === "image");

  const applyNativeAudio =
    atlasModelSupportsGenerateAudio(model) && (action === "text" || action === "image");

  if (seedanceDimensions) {
    const { width, height } = dimensionsForAspectResolution(aspectRatio, resolution);
    warnIfSeedanceDimensionsMismatch(aspectRatio, width, height);
    // Seedance: width/height + single `aspect_ratio` (no camelCase duplicate).
    // Without aspect_ratio, cinematic prompts often default to 16:9 composition.
    atlasBody = {
      model,
      prompt,
      width,
      height,
      aspect_ratio: aspectRatio,
      duration: durationSec,
      fps
    };
    if (image_url) {
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
    if (applyNativeAudio) {
      applyAtlasNativeAudioFields(atlasBody, model, generateAudio);
    }
  } else {
    // Kling, Veo, Wan, Hailuo — `aspect_ratio` + `resolution` on flat body.
    atlasBody = {
      model,
      prompt,
      duration: durationSec,
      fps,
      aspect_ratio: aspectRatio,
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
    if (applyNativeAudio) {
      applyAtlasNativeAudioFields(atlasBody, model, generateAudio);
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[generate-video] Atlas request", {
      videoModel,
      action,
      model,
      envelope: seedanceDimensions ? "seedance-width-height" : "flat-aspect-ratio",
      aspectRatio,
      resolution,
      width: seedanceDimensions ? atlasBody.width : undefined,
      height: seedanceDimensions ? atlasBody.height : undefined,
      keys: Object.keys(atlasBody),
      promptLen: prompt.length,
      durationSec,
      generateAudio,
      atlasAudioField: generateAudio
        ? isAtlasKlingModelSlug(model)
          ? "sound"
          : "generate_audio"
        : null,
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
    seedanceDimensions ? "seedance-width-height" : "flat-aspect-ratio",
    "| resolution:",
    resolution,
    seedanceDimensions ? `| ${String(atlasBody.width)}x${String(atlasBody.height)}` : `| aspect ${aspectRatio}`
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
    console.error("[generate-video POST] Atlas generateVideo HTTP error", {
      httpStatus: createRes.status,
      atlasResponse: JSON.stringify(createJson),
      model,
      atlasBody
    });
    return NextResponse.json(
      {
        error:
          createJson.message ??
          `Atlas generateVideo failed (${createRes.status})`,
        atlas_error: createJson.data?.error ?? createJson.message ?? null
      },
      { status: createRes.status >= 400 ? createRes.status : 502 }
    );
  }

  console.log("[generate-video POST] Atlas create response", {
    httpStatus: createRes.status,
    predictionId: createJson.data?.id,
    initialStatus: createJson.data?.status,
    atlasResponse: JSON.stringify(createJson)
  });

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
    const atlasRaw =
      createJson.data?.error ?? createJson.message ?? "Atlas prediction failed";
    console.error("[generate-video POST] Atlas task failed (immediate)", {
      predictionId,
      atlasError: atlasRaw,
      atlasResponse: JSON.stringify(createJson),
      model,
      atlasBody
    });
    const err = formatAtlasVideoFailureForUi(atlasRaw, {
      generateAudio,
      hostIsProduction: process.env.VERCEL_ENV === "production"
    });
    return NextResponse.json(
      { error: err, atlas_error: atlasRaw, atlas_model: model, prediction_id: predictionId },
      { status: 502 }
    );
  }

  const atlasDebug =
    seedanceDimensions && atlasBody.width != null && atlasBody.height != null
      ? {
          width: atlasBody.width,
          height: atlasBody.height,
          aspect_ratio: aspectRatio,
          generate_audio: applyNativeAudio ? generateAudio : undefined
        }
      : {
          aspect_ratio: aspectRatio,
          resolution,
          generate_audio: applyNativeAudio ? generateAudio : undefined
        };

  return NextResponse.json({
    pending: true,
    prediction_id: predictionId,
    poll_interval_ms: CLIENT_POLL_HINT_MS,
    atlas_model: model,
    atlas_request: atlasDebug
  });
}
