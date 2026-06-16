import { NextResponse } from "next/server";

import { AtlasApiError, fetchAtlasPrediction } from "@/lib/atlas-api";
import {
  applyAtlasNativeAudioFields,
  atlasModelSupportsGenerateAudio,
  isAtlasKlingModelSlug,
  normalizeAtlasKlingDurationSeconds
} from "@/lib/atlas-video-generate-audio";
import {
  isKlingMotionControlAtlasModel,
  normalizeKlingMotionCharacterOrientation,
  normalizeKlingMotionDurationSeconds,
  resolveMotionControlAtlasPrompt,
  videoComposerUsesOptionalMotionPrompt
} from "@/lib/atlas-kling-motion-control";
import {
  buildHappyHorseAtlasBody,
  HAPPYHORSE_VIDEO_EDIT_MAX_IMAGES,
  isHappyHorseAtlasModel,
  isHappyHorseComposerId,
  isHappyHorseReferenceToVideoModel,
  isHappyHorseVideoEditModel,
  normalizeHappyHorseDurationSeconds
} from "@/lib/atlas-happyhorse-video";
import {
  buildWan27ImageAtlasBody,
  buildWan27ReferenceAtlasBody,
  buildWan27TextAtlasBody,
  buildWan27VideoEditAtlasBody,
  isWan27AtlasModel,
  isWan27ComposerId,
  isWan27ImageToVideoModel,
  isWan27ReferenceToVideoModel,
  isWan27TextToVideoModel,
  isWan27VideoEditModel,
  normalizeWan27DurationSeconds,
  normalizeWan27ReferenceDurationSeconds,
  resolveWan27GenerateAudioFlag,
  WAN_27_REFERENCE_MAX_VIDEOS,
  WAN_27_REFERENCE_MAX_VOICE_AUDIOS,
  WAN_27_VIDEO_EDIT_MAX_IMAGES
} from "@/lib/atlas-wan-27-video";
import {
  buildVeo31ReferenceAtlasBody,
  buildVeo31TextImageAtlasBody,
  isVeo31AtlasModel,
  isVeo31ComposerId,
  isVeo31ImageToVideoModel,
  isVeo31ReferenceToVideoModel,
  isVeo31TextToVideoModel,
  normalizeVeo31DurationSeconds,
  normalizeVeo31ReferenceDurationSeconds,
  veo31AspectFromUi,
  VEO_31_REFERENCE_TO_VIDEO_MAX_IMAGES
} from "@/lib/atlas-veo31-video";
import {
  buildKlingV3AtlasBody,
  isKlingV3AtlasModel,
  klingV3AspectFromUi,
  normalizeKlingV3DurationSeconds,
  normalizeKlingV3ShotMode
} from "@/lib/atlas-kling-v3-video";
import {
  buildGeminiOmniFlashAtlasBody,
  GEMINI_OMNI_FLASH_I2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_MAX_IMAGES,
  GEMINI_OMNI_FLASH_R2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS,
  isGeminiOmniFlashAtlasModel,
  isGeminiOmniFlashImageAtlasModel,
  isGeminiOmniFlashReferenceAtlasModel,
  isGeminiOmniFlashTextAtlasModel,
  normalizeGeminiOmniFlashDurationSeconds,
  normalizeGeminiOmniFlashReferenceDurationSeconds
} from "@/lib/atlas-gemini-omni-video";
import {
  buildGrokImagineVideoAtlasBody,
  GROK_IMAGINE_VIDEO_MAX_REFERENCE_IMAGES,
  GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
  isGrokImagineVideoAtlasModel,
  isGrokImagineVideoImageAtlasModel,
  isGrokImagineVideoReferenceAtlasModel,
  isGrokImagineVideoTextAtlasModel,
  normalizeGrokImagineVideoDurationSeconds,
  normalizeGrokImagineVideoReferenceDurationSeconds
} from "@/lib/atlas-grok-video";
import {
  buildHailuo23AtlasBody,
  HAILUO_23_T2V_DURATION_SECONDS,
  isHailuo23AtlasModel,
  isHailuo23ComposerId,
  isHailuo23ImageAtlasModel,
  normalizeHailuo23I2vDurationSeconds
} from "@/lib/atlas-hailuo-video";
import {
  applyWan26ShotTypeFields,
  isWan26AtlasModel,
  normalizeWan26ShotType
} from "@/lib/atlas-wan-26-video";
import {
  buildWanCharacterSwapAtlasBody,
  isWanCharacterSwapAtlasModel,
  videoComposerSupportsWanCharacterSwap
} from "@/lib/atlas-wan-character-swap";
import {
  buildAudioToVideoAtlasBody,
  isAudioToVideoAtlasModelSlug,
  isAudioToVideoComposerId,
  resolveAudioToVideoAtlasSlug
} from "@/lib/atlas-audio-to-video";
import {
  type AtlasVideoRouteAction,
  normalizeAtlasVideoSpeedTier,
  resolveAtlasVideoModelId,
  videoComposerSupportsMotionControl
} from "@/lib/atlas-video-model-ids";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  ATLAS_VIDEO_UPSCALER_COMPOSER_ID,
  buildAtlasVideoUpscalerBody,
  normalizeAtlasVideoUpscalerTarget
} from "@/lib/atlas-video-upscaler";
import {
  assertCanAfford,
  creditsForVideoModel,
  deductCreditsForPrediction,
  insufficientCreditsResponse
} from "@/lib/credits-charge";
import { env } from "@/lib/env";
import { extractAtlasVideoOutputUrl } from "@/lib/extract-atlas-video-output-url";
import { formatAtlasVideoFailureForUi } from "@/lib/atlas-video-failure-message";
import {
  buildSeedanceReferenceAtlasBody,
  isSeedanceReferenceToVideoModel,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS
} from "@/lib/atlas-seedance-reference-video";
import {
  isViduAtlasModelSlug,
  isViduQ3ProComposerId,
  isViduReferenceToVideoModel,
  isViduStartEndToVideoModel,
  normalizeViduDurationSeconds
} from "@/lib/atlas-vidu-video";
import {
  augmentSeedancePromptForAspect,
  seedanceAtlasRequestDimensions
} from "@/lib/seedance-atlas-dimensions";
import { enforceContentPolicy, requestIp } from "@/lib/content-moderation";
import { stripVideoComposerAssetTokens } from "@/lib/strip-video-composer-prompt";
import { resolveZorixaActor } from "@/lib/zorixa-mcp-auth";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
/** Client polls `GET ?predictionId=` this often (serverless POST cannot block for minutes). */
const CLIENT_POLL_HINT_MS = 3000;

type GenerateVideoAction = AtlasVideoRouteAction | "upscale";

type ClientBody = {
  prompt?: string;
  action?: GenerateVideoAction;
  /** Zorixa composer row id (e.g. kling-3-pro) — maps to Atlas `model` slug. */
  videoModel?: string;
  image_url?: string;
  /** Seedance I2V optional end frame (Atlas `last_image`). */
  last_image_url?: string;
  /** Seedance reference-to-video — 1–9 public image URLs. */
  reference_images?: string[];
  /** Seedance reference-to-video — up to 3 public video URLs. */
  reference_videos?: string[];
  /** Seedance reference-to-video — up to 3 public audio URLs. */
  reference_audios?: string[];
  audio_url?: string;
  video_url?: string;
  /** Kling 2.6 motion control — `image` (match ref image) or `video` (match ref motion clip). */
  character_orientation?: string;
  /** Kling 2.6 motion control — preserve audio from motion reference video. */
  keep_original_sound?: boolean;
  /** UI aspect selector (16:9, 9:16, 1:1, 4:3) — forwarded to Atlas. */
  aspectRatio?: string;
  /** UI resolution tier (480p, 720p, 1080p) — forwarded to Atlas `resolution`. */
  resolution?: string;
  /** Clip length in seconds (clamped). */
  duration?: number;
  /** Native soundtrack via Atlas `generate_audio` (Seedance, Kling v3, etc.). */
  generate_audio?: boolean;
  /** Hailuo 2.3 — Atlas prompt expansion / safety checker (default on for T2V Pro). */
  enable_prompt_expansion?: boolean;
  /** UI Standard/Fast → Atlas model slug tier (Seedance fast, Kling std). */
  speed_tier?: string;
  speedTier?: string;
  /** Wan 2.6 — Atlas `shot_type`: `single` | `multi` (multi sets `enable_prompt_expansion`). */
  shot_type?: string;
  /** Kling 3.0 Pro — `single` | `multi` (multi sets `multi_shot` + `shot_type: intelligent`). */
  kling_v3_shot_mode?: string;
  /** Video upscaler — Atlas `target_resolution` (1080p | 2k). */
  target_resolution?: string;
};

const ALLOWED_ASPECT_RATIOS = new Set(["16:9", "9:16", "1:1", "4:3", "3:4"]);
const DEFAULT_ASPECT_RATIO = "9:16";

function normalizeAspectRatio(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_ASPECT_RATIO;
  const v = raw.trim();
  return ALLOWED_ASPECT_RATIOS.has(v) ? v : DEFAULT_ASPECT_RATIO;
}

const ALLOWED_RESOLUTIONS = new Set(["480p", "720p", "1080p", "4k"]);
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
  return /seedance/i.test(model) && !/reference-to-video/i.test(model);
}

const REFERENCE_VIDEO_COMPOSER_IDS = new Set([
  "seedance-2",
  GEMINI_OMNI_FLASH_R2V_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
  "vidu-q3",
  "happyhorse-1",
  "wan-2-7",
  "google-veo-3-1"
]);

function isReferenceVideoComposerId(composerId: string): boolean {
  return REFERENCE_VIDEO_COMPOSER_IDS.has(composerId);
}

function isSeedanceImageToVideoModel(model: string): boolean {
  return /seedance/i.test(model) && /image-to-video/i.test(model);
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
  const pollActionRaw = searchParams.get("action");
  const pollAction: "text" | "image" | "reference" =
    pollActionRaw === "image"
      ? "image"
      : pollActionRaw === "reference"
        ? "reference"
        : "text";
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
              hostIsProduction: process.env.VERCEL_ENV === "production",
              action: pollAction
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
      atlas_error: msg,
      prediction_id: predictionId,
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

async function handleVideoUpscalePost(
  body: ClientBody,
  actor: NonNullable<Awaited<ReturnType<typeof resolveZorixaActor>>>,
  apiKey: string
) {
  const rawVideo = typeof body.video_url === "string" ? body.video_url.trim() : "";
  const video_url = coerceToPublicHttpsUrl(rawVideo);
  if (!video_url) {
    return NextResponse.json(
      { error: "Missing public https:// video URL to upscale." },
      { status: 400 }
    );
  }

  const durationSec = normalizeDurationSeconds(body.duration);
  const target = normalizeAtlasVideoUpscalerTarget(
    body.target_resolution ?? body.resolution
  );
  const creditCost = creditsForVideoModel(ATLAS_VIDEO_UPSCALER_COMPOSER_ID, {
    durationSeconds: durationSec,
    resolution: target
  });

  const afford = await assertCanAfford(actor.userId, creditCost);
  if (!afford.ok) {
    if (afford.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(afford.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const atlasBody = buildAtlasVideoUpscalerBody({
    videoUrl: video_url,
    targetResolution: target,
    copyAudio: true
  });

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
          createJson.message ?? `Atlas video upscaler failed (${createRes.status})`,
        atlas_error: createJson.data?.error ?? createJson.message ?? null
      },
      { status: createRes.status >= 400 ? createRes.status : 502 }
    );
  }

  const predictionId = createJson.data?.id;
  if (!predictionId) {
    return NextResponse.json({ error: "Atlas did not return a prediction id" }, { status: 502 });
  }

  const charge = await deductCreditsForPrediction({
    userId: actor.userId,
    predictionId,
    amount: creditCost,
    featureUsed: "video"
  });
  if (!charge.ok) {
    if (charge.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(charge.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Could not deduct credits" }, { status: 500 });
  }

  const initialStatus = createJson.data?.status;
  if (initialStatus === "completed" || initialStatus === "succeeded") {
    const videoUrl = extractAtlasVideoOutputUrl(createJson.data);
    if (videoUrl) {
      return NextResponse.json({
        video_url: videoUrl,
        prediction_id: predictionId,
        credits_spent: charge.creditsSpent,
        credits_balance: charge.balanceAfter
      });
    }
    return NextResponse.json(
      { error: "Atlas returned completed without an output URL" },
      { status: 502 }
    );
  }

  if (initialStatus === "failed") {
    const atlasRaw = createJson.data?.error ?? createJson.message ?? "Atlas upscaler failed";
    return NextResponse.json(
      {
        error: formatAtlasVideoFailureForUi(atlasRaw, {
          generateAudio: false,
          hostIsProduction: process.env.VERCEL_ENV === "production"
        }),
        atlas_error: atlasRaw,
        prediction_id: predictionId
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    pending: true,
    prediction_id: predictionId,
    poll_interval_ms: CLIENT_POLL_HINT_MS,
    atlas_model: ATLAS_VIDEO_UPSCALER_COMPOSER_ID,
    credits_spent: charge.creditsSpent,
    credits_balance: charge.balanceAfter
  });
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

  const actor = await resolveZorixaActor(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (body.action === "upscale") {
    return handleVideoUpscalePost(body, actor, apiKey);
  }

  const action: AtlasVideoRouteAction = (body.action ?? "text") as AtlasVideoRouteAction;
  const videoModelEarly =
    typeof body.videoModel === "string" ? body.videoModel.trim() : "";

  let prompt = stripVideoComposerAssetTokens(
    typeof body.prompt === "string" ? body.prompt.trim() : ""
  );
  const motionPromptOptional =
    action === "motion-control" &&
    videoModelEarly &&
    videoComposerUsesOptionalMotionPrompt(videoModelEarly);

  if (!prompt && !motionPromptOptional) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }
  if (!prompt && motionPromptOptional) {
    prompt = resolveMotionControlAtlasPrompt("");
  }

  const videoWorkflow =
    action === "motion-control"
      ? ("character_swap" as const)
      : /\bugc\b/i.test(prompt) || /\bai\s+influencer\b/i.test(prompt)
        ? ("ugc_generation" as const)
        : ("video_generation" as const);

  const policyBlock = await enforceContentPolicy({
    userId: actor.userId,
    workflow: videoWorkflow,
    route: "/api/generate-video",
    texts: [prompt],
    ip: requestIp(request),
    metadata: { action, videoModel: body.videoModel ?? null }
  });
  if (policyBlock) return policyBlock;

  const videoModel =
    typeof body.videoModel === "string" ? body.videoModel.trim() : "";
  if (!videoModel) {
    return NextResponse.json({ error: "Missing videoModel" }, { status: 400 });
  }

  const speedTier = normalizeAtlasVideoSpeedTier(body.speed_tier ?? body.speedTier);
  const model =
    action === "lipsync" && isAudioToVideoComposerId(videoModel)
      ? resolveAudioToVideoAtlasSlug(videoModel)
      : resolveAtlasVideoModelId(videoModel, action, speedTier);
  if (!model) {
    return NextResponse.json(
      { error: `Unknown video model: ${videoModel}` },
      { status: 400 }
    );
  }

  if (isHailuo23ComposerId(videoModel) && action !== "text" && action !== "image") {
    return NextResponse.json(
      { error: "Hailuo 2.3 supports Text to Video and Image to Video only." },
      { status: 400 }
    );
  }


  let image_url =
    typeof body.image_url === "string" ? body.image_url.trim() : "";
  let last_image_url =
    typeof body.last_image_url === "string" ? body.last_image_url.trim() : "";
  let audio_url =
    typeof body.audio_url === "string" ? body.audio_url.trim() : "";
  let video_url =
    typeof body.video_url === "string" ? body.video_url.trim() : "";

  if (
    action === "image" &&
    !image_url &&
    videoModel !== GEMINI_OMNI_FLASH_I2V_COMPOSER_ID
  ) {
    return NextResponse.json(
      { error: "Missing image_url for Image to Video" },
      { status: 400 }
    );
  }

  const rawReferenceImages = Array.isArray(body.reference_images) ? body.reference_images : [];
  let reference_images: string[] = [];
  for (const raw of rawReferenceImages) {
    if (typeof raw !== "string") continue;
    const t = raw.trim();
    if (!t) continue;
    const c = coerceToPublicHttpsUrl(t);
    if (!c) {
      return NextResponse.json(
        {
          error:
            "Each reference image must be a public https:// URL (upload local or data URLs first)."
        },
        { status: 400 }
      );
    }
    reference_images.push(c);
  }
  reference_images = reference_images.slice(0, 9);

  const rawReferenceVideos = Array.isArray(body.reference_videos) ? body.reference_videos : [];
  let reference_videos: string[] = [];
  for (const raw of rawReferenceVideos) {
    if (typeof raw !== "string") continue;
    const t = raw.trim();
    if (!t) continue;
    const c = coerceToPublicHttpsUrl(t);
    if (!c) {
      return NextResponse.json(
        {
          error:
            "Each reference video must be a public https:// URL (upload local or data URLs first)."
        },
        { status: 400 }
      );
    }
    reference_videos.push(c);
  }
  reference_videos = reference_videos.slice(
    0,
    Math.max(SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS, WAN_27_REFERENCE_MAX_VIDEOS)
  );

  const rawReferenceAudios = Array.isArray(body.reference_audios) ? body.reference_audios : [];
  let reference_audios: string[] = [];
  for (const raw of rawReferenceAudios) {
    if (typeof raw !== "string") continue;
    const t = raw.trim();
    if (!t) continue;
    const c = coerceToPublicHttpsUrl(t);
    if (!c) {
      return NextResponse.json(
        {
          error:
            "Each reference audio must be a public https:// URL (upload local or data URLs first)."
        },
        { status: 400 }
      );
    }
    reference_audios.push(c);
  }
  reference_audios = reference_audios.slice(0, SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS);

  if (action === "image" && isGeminiOmniFlashImageAtlasModel(model) && reference_images.length < 1) {
    return NextResponse.json(
      { error: "Add at least one reference image for Gemini Omni Flash Image-to-Video." },
      { status: 400 }
    );
  }
  if (action === "image" && isGrokImagineVideoImageAtlasModel(model) && !image_url) {
    return NextResponse.json(
      { error: "Add a start image for Grok Imagine Video Image-to-Video v1.5." },
      { status: 400 }
    );
  }

  if (action === "reference") {
    if (!isReferenceVideoComposerId(videoModel)) {
      return NextResponse.json(
        {
          error:
            "Reference to Video requires Seedance 2.0, Gemini Omni Flash R2V, Grok Imagine Video R2V, Vidu Q3, HappyHorse 1.0, Wan 2.7, or Veo 3.1."
        },
        { status: 400 }
      );
    }
    if (
      !isSeedanceReferenceToVideoModel(model) &&
      !isViduReferenceToVideoModel(model) &&
      !isHappyHorseReferenceToVideoModel(model) &&
      !isWan27ReferenceToVideoModel(model) &&
      !isVeo31ReferenceToVideoModel(model) &&
      !isGeminiOmniFlashReferenceAtlasModel(model) &&
      !isGrokImagineVideoReferenceAtlasModel(model)
    ) {
      return NextResponse.json(
        { error: "Reference to Video model slug is not configured for this tier." },
        { status: 400 }
      );
    }
    if (isGeminiOmniFlashReferenceAtlasModel(model)) {
      if (reference_images.length < 1 || reference_videos.length < 1) {
        return NextResponse.json(
          {
            error:
              "Gemini Omni Flash Reference-to-Video requires at least one reference image and one source video."
          },
          { status: 400 }
        );
      }
    } else if (isGrokImagineVideoReferenceAtlasModel(model)) {
      if (reference_images.length < 1) {
        return NextResponse.json(
          {
            error:
              "Grok Imagine Video Reference-to-Video requires at least one reference image."
          },
          { status: 400 }
        );
      }
    } else if (isSeedanceReferenceToVideoModel(model)) {
      if (reference_images.length < 1 && reference_videos.length < 1) {
        return NextResponse.json(
          {
            error:
              "Add at least one reference image or reference video for Seedance Reference to Video."
          },
          { status: 400 }
        );
      }
    } else if (isWan27ReferenceToVideoModel(model)) {
      if (reference_images.length < 1 && reference_videos.length < 1) {
        return NextResponse.json(
          {
            error:
              "Add at least one reference image or reference video for Wan 2.7 Reference to Video."
          },
          { status: 400 }
        );
      }
    } else if (reference_images.length < 1) {
      return NextResponse.json(
        { error: "Add at least one reference image for Reference to Video." },
        { status: 400 }
      );
    }
  }
  if (action === "lipsync" && !audio_url) {
    return NextResponse.json(
      { error: "Missing audio_url for Audio to Video" },
      { status: 400 }
    );
  }
  if (action === "lipsync" && isAudioToVideoComposerId(videoModel) && !image_url) {
    return NextResponse.json(
      { error: "Missing portrait image for Audio to Video" },
      { status: 400 }
    );
  }
  if (action === "edit" && !video_url) {
    return NextResponse.json(
      { error: "Missing video_url for Video to Video" },
      { status: 400 }
    );
  }
  if (action === "start-end") {
    if (!isViduQ3ProComposerId(videoModel)) {
      return NextResponse.json(
        { error: "Start/End frames require Vidu Q3-Pro in the model picker." },
        { status: 400 }
      );
    }
    if (!isViduStartEndToVideoModel(model)) {
      return NextResponse.json(
        { error: "Start-End model slug is not configured." },
        { status: 400 }
      );
    }
    if (!image_url) {
      return NextResponse.json(
        { error: "Missing image (start frame) for Vidu Start-End to Video." },
        { status: 400 }
      );
    }
    if (!last_image_url) {
      return NextResponse.json(
        { error: "Missing end_image (end frame) for Vidu Start-End to Video." },
        { status: 400 }
      );
    }
  }
  if (action === "motion-control") {
    if (
      !videoComposerSupportsMotionControl(videoModel) &&
      !videoComposerSupportsWanCharacterSwap(videoModel)
    ) {
      return NextResponse.json(
        {
          error:
            "Video to Video motion control requires Kling 2.6 Motion or Wan 2.2 Character Swap in the model picker."
        },
        { status: 400 }
      );
    }
    if (!image_url) {
      return NextResponse.json(
        { error: "Missing image_url (character image) for Motion Control." },
        { status: 400 }
      );
    }
    if (!video_url) {
      return NextResponse.json(
        { error: "Missing video_url (motion reference clip) for Motion Control." },
        { status: 400 }
      );
    }
  }

  if ((action === "image" || action === "motion-control") && image_url) {
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
  if (last_image_url) {
    const c = coerceToPublicHttpsUrl(last_image_url);
    if (!c) {
      return NextResponse.json(
        {
          error:
            "last_image_url must be a public https:// URL so Atlas can fetch the end frame (upload local or data URLs first)."
        },
        { status: 400 }
      );
    }
    last_image_url = c;
  }
  if (
    action === "image" &&
    last_image_url &&
    !isSeedanceImageToVideoModel(model) &&
    !isKlingV3AtlasModel(model) &&
    !isWan27ImageToVideoModel(model) &&
    !isVeo31ImageToVideoModel(model)
  ) {
    return NextResponse.json(
      {
        error:
          "End frame is only supported for Seedance 2.0/1.5, Wan 2.7, or Kling 3.0 Pro Image to Video."
      },
      { status: 400 }
    );
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
  if ((action === "edit" || action === "motion-control") && video_url) {
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

  let aspectRatio = normalizeAspectRatio(body.aspectRatio);
  let resolution = normalizeResolution(body.resolution);
  let durationSec = normalizeDurationSeconds(body.duration);

  const fps = 24;

  let atlasBody: Record<string, unknown>;

  const motionOrientation =
    action === "motion-control"
      ? normalizeKlingMotionCharacterOrientation(body.character_orientation)
      : null;

  if (isGrokImagineVideoAtlasModel(model)) {
    durationSec = isGrokImagineVideoReferenceAtlasModel(model)
      ? normalizeGrokImagineVideoReferenceDurationSeconds(durationSec)
      : normalizeGrokImagineVideoDurationSeconds(durationSec);
  } else if (isGeminiOmniFlashAtlasModel(model)) {
    durationSec = isGeminiOmniFlashReferenceAtlasModel(model)
      ? normalizeGeminiOmniFlashReferenceDurationSeconds(durationSec)
      : normalizeGeminiOmniFlashDurationSeconds(durationSec);
  } else if (action === "motion-control" && isKlingMotionControlAtlasModel(model)) {
    durationSec = normalizeKlingMotionDurationSeconds(durationSec, motionOrientation!);
  } else if (isKlingV3AtlasModel(model)) {
    durationSec = normalizeKlingV3DurationSeconds(durationSec);
  } else if (isAtlasKlingModelSlug(model)) {
    durationSec = normalizeAtlasKlingDurationSeconds(durationSec);
  } else if (isViduAtlasModelSlug(model) || isViduQ3ProComposerId(videoModel)) {
    durationSec = normalizeViduDurationSeconds(durationSec);
  } else if (isHappyHorseAtlasModel(model) || isHappyHorseComposerId(videoModel)) {
    durationSec = normalizeHappyHorseDurationSeconds(durationSec);
  } else if (action === "reference" && isWan27ReferenceToVideoModel(model)) {
    durationSec = normalizeWan27ReferenceDurationSeconds(durationSec);
  } else if (isWan27AtlasModel(model) || isWan27ComposerId(videoModel)) {
    durationSec = normalizeWan27DurationSeconds(durationSec);
  } else if (action === "reference" && isVeo31ReferenceToVideoModel(model)) {
    durationSec = normalizeVeo31ReferenceDurationSeconds(durationSec);
  } else if (
    (isVeo31AtlasModel(model) || isVeo31ComposerId(videoModel)) &&
    action !== "reference"
  ) {
    durationSec = normalizeVeo31DurationSeconds(durationSec, resolution);
    aspectRatio = veo31AspectFromUi(aspectRatio);
    resolution = resolution.trim().toLowerCase() === "1080p" ? "1080p" : "720p";
  } else if (isHailuo23AtlasModel(model) || isHailuo23ComposerId(videoModel)) {
    durationSec = isHailuo23ImageAtlasModel(model)
      ? normalizeHailuo23I2vDurationSeconds(durationSec)
      : HAILUO_23_T2V_DURATION_SECONDS;
  }

  const seedanceDimensions = atlasSeedanceModelUsesDimensions(model);
  const applyNativeAudio =
    atlasModelSupportsGenerateAudio(model) &&
    (action === "text" ||
      action === "image" ||
      action === "reference" ||
      action === "start-end");

  const wanNativeAudio =
    applyNativeAudio && (isWan27AtlasModel(model) || isWan27ComposerId(videoModel));

  let generateAudio =
    body.generate_audio === true &&
    atlasModelSupportsGenerateAudio(model) &&
    (action === "text" ||
      action === "image" ||
      action === "reference" ||
      action === "start-end");

  if (wanNativeAudio) {
    generateAudio = resolveWan27GenerateAudioFlag(body.generate_audio);
  }

  const creditCost = creditsForVideoModel(videoModel, {
    durationSeconds: durationSec,
    resolution,
    speedTier,
    generateAudio,
    routeAction: action
  });
  const afford = await assertCanAfford(actor.userId, creditCost);
  if (!afford.ok) {
    if (afford.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(afford.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const seedanceI2v = isSeedanceImageToVideoModel(model);
  const seedanceRouteAction = action === "image" ? "image" : "text";

  const seedanceRequestDims = seedanceDimensions
    ? seedanceAtlasRequestDimensions(aspectRatio, resolution, seedanceRouteAction)
    : null;

  if (action === "motion-control" && isKlingMotionControlAtlasModel(model)) {
    atlasBody = {
      model,
      prompt,
      image: image_url,
      video: video_url,
      character_orientation: motionOrientation,
      keep_original_sound: body.keep_original_sound !== false,
      duration: durationSec
    };
  } else if (action === "motion-control" && isWanCharacterSwapAtlasModel(model)) {
    atlasBody = buildWanCharacterSwapAtlasBody({
      model,
      prompt,
      image_url,
      video_url,
      speedTier
    });
  } else if (action === "lipsync" && isAudioToVideoAtlasModelSlug(model)) {
    atlasBody = buildAudioToVideoAtlasBody({
      model,
      prompt,
      image_url,
      audio_url,
      resolution
    });
  } else if (
    isGeminiOmniFlashTextAtlasModel(model) ||
    isGeminiOmniFlashImageAtlasModel(model) ||
    isGeminiOmniFlashReferenceAtlasModel(model)
  ) {
    atlasBody = buildGeminiOmniFlashAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      images:
        action === "image" || action === "reference"
          ? reference_images.slice(0, GEMINI_OMNI_FLASH_MAX_IMAGES)
          : undefined,
      videoUrl:
        action === "reference"
          ? reference_videos.slice(0, GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS)[0]
          : undefined
    });
  } else if (
    isGrokImagineVideoTextAtlasModel(model) ||
    isGrokImagineVideoImageAtlasModel(model) ||
    isGrokImagineVideoReferenceAtlasModel(model)
  ) {
    atlasBody = buildGrokImagineVideoAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      imageUrl: action === "image" ? (image_url ?? undefined) : undefined,
      referenceImages:
        action === "reference"
          ? reference_images.slice(0, GROK_IMAGINE_VIDEO_MAX_REFERENCE_IMAGES)
          : undefined
    });
  } else if (action === "reference" && isSeedanceReferenceToVideoModel(model)) {
    atlasBody = buildSeedanceReferenceAtlasBody({
      model,
      prompt,
      reference_images,
      reference_videos: reference_videos.length > 0 ? reference_videos : undefined,
      reference_audios: reference_audios.length > 0 ? reference_audios : undefined,
      durationSec,
      resolution,
      aspectRatio
    });
    if (applyNativeAudio) {
      applyAtlasNativeAudioFields(atlasBody, model, generateAudio);
    }
  } else if (action === "reference" && isViduReferenceToVideoModel(model)) {
    durationSec = normalizeViduDurationSeconds(durationSec);
    atlasBody = {
      model,
      prompt,
      reference_images,
      duration: durationSec,
      aspect_ratio: aspectRatio,
      resolution,
      fps
    };
    if (applyNativeAudio) {
      applyAtlasNativeAudioFields(atlasBody, model, generateAudio);
    }
  } else if (action === "start-end" && isViduStartEndToVideoModel(model)) {
    atlasBody = {
      model,
      prompt,
      image: image_url,
      end_image: last_image_url,
      duration: durationSec,
      aspect_ratio: aspectRatio,
      resolution,
      fps
    };
    if (applyNativeAudio) {
      applyAtlasNativeAudioFields(atlasBody, model, generateAudio);
    }
  } else if (action === "reference" && isHappyHorseReferenceToVideoModel(model)) {
    atlasBody = buildHappyHorseAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      referenceImages: reference_images
    });
  } else if (action === "edit" && isHappyHorseVideoEditModel(model)) {
    const editReferenceImages = reference_images.slice(0, HAPPYHORSE_VIDEO_EDIT_MAX_IMAGES);
    atlasBody = buildHappyHorseAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      videoUrl: video_url,
      referenceImages:
        editReferenceImages.length > 0 ? editReferenceImages : undefined
    });
  } else if (isHappyHorseAtlasModel(model)) {
    atlasBody = buildHappyHorseAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      imageUrl: action === "image" ? image_url : undefined
    });
  } else if (action === "reference" && isWan27ReferenceToVideoModel(model)) {
    const wanVideos = reference_videos.slice(0, WAN_27_REFERENCE_MAX_VIDEOS);
    const wanVoice = reference_audios.slice(0, WAN_27_REFERENCE_MAX_VOICE_AUDIOS)[0];
    atlasBody = buildWan27ReferenceAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      images: reference_images,
      videos: wanVideos,
      voiceAudioUrl: wanVoice,
      generateAudio: applyNativeAudio ? generateAudio : undefined
    });
  } else if (action === "reference" && isVeo31ReferenceToVideoModel(model)) {
    const veoImages = reference_images.slice(0, VEO_31_REFERENCE_TO_VIDEO_MAX_IMAGES);
    atlasBody = buildVeo31ReferenceAtlasBody({
      model,
      prompt,
      images: veoImages,
      resolution,
      generateAudio: applyNativeAudio ? generateAudio : undefined
    });
  } else if (
    (action === "text" && isVeo31TextToVideoModel(model)) ||
    (action === "image" && isVeo31ImageToVideoModel(model))
  ) {
    if (action === "image" && !image_url) {
      return NextResponse.json(
        { error: "Missing image for Veo 3.1 Image to Video (Atlas requires `image` URL)." },
        { status: 400 }
      );
    }
    atlasBody = buildVeo31TextImageAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      imageUrl: action === "image" ? image_url : undefined,
      lastImageUrl: action === "image" ? last_image_url : undefined,
      generateAudio: applyNativeAudio ? generateAudio : undefined
    });
  } else if (action === "edit" && isWan27VideoEditModel(model)) {
    const wanEditRefs = reference_images.slice(0, WAN_27_VIDEO_EDIT_MAX_IMAGES);
    atlasBody = buildWan27VideoEditAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      videoUrl: video_url,
      referenceImages: wanEditRefs.length > 0 ? wanEditRefs : undefined
    });
  } else if (action === "text" && isWan27TextToVideoModel(model)) {
    atlasBody = buildWan27TextAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      generateAudio: applyNativeAudio ? generateAudio : undefined
    });
  } else if (isKlingV3AtlasModel(model)) {
    if (action === "image" && !image_url) {
      return NextResponse.json(
        { error: "Missing image for Kling 3.0 Image to Video (Atlas requires `image` URL)." },
        { status: 400 }
      );
    }
    atlasBody = buildKlingV3AtlasBody({
      model,
      prompt,
      durationSec,
      aspectRatio: klingV3AspectFromUi(aspectRatio),
      imageUrl: action === "image" ? image_url : undefined,
      endImageUrl: action === "image" ? last_image_url : undefined,
      shotMode: normalizeKlingV3ShotMode(body.kling_v3_shot_mode)
    });
    if (applyNativeAudio) {
      applyAtlasNativeAudioFields(atlasBody, model, generateAudio);
    }
  } else if (action === "image" && isWan27ImageToVideoModel(model)) {
    if (!image_url) {
      return NextResponse.json(
        { error: "Missing image for Wan 2.7 Image to Video (Atlas requires `image` URL)." },
        { status: 400 }
      );
    }
    atlasBody = buildWan27ImageAtlasBody({
      model,
      prompt,
      aspectRatio,
      resolution,
      durationSec,
      imageUrl: image_url,
      lastImageUrl: last_image_url,
      drivingAudioUrl: audio_url,
      generateAudio: applyNativeAudio ? generateAudio : undefined
    });
  } else if (seedanceDimensions && seedanceRequestDims) {
    prompt = augmentSeedancePromptForAspect(prompt, aspectRatio);
    const dims = seedanceRequestDims;
    const { width, height } = dims;
    warnIfSeedanceDimensionsMismatch(aspectRatio, dims.logical.width, dims.logical.height);
    // Seedance T2V: swapped W/H + aspect_ratio. I2V: logical pixels + required `image` only.
    atlasBody = {
      model,
      prompt,
      width,
      height,
      duration: durationSec,
      fps
    };
    if (!seedanceI2v) {
      atlasBody.aspect_ratio = aspectRatio;
    }
    if (seedanceI2v) {
      if (!image_url) {
        return NextResponse.json(
          { error: "Missing image for Seedance image-to-video (Atlas requires `image` URL)" },
          { status: 400 }
        );
      }
      atlasBody.image = image_url;
      if (last_image_url) {
        atlasBody.last_image = last_image_url;
      }
    } else if (image_url) {
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
  } else if (isHailuo23AtlasModel(model)) {
    if (action === "image" && !image_url) {
      return NextResponse.json(
        { error: "Missing image for Hailuo 2.3 Image to Video (Atlas requires `image` URL)." },
        { status: 400 }
      );
    }
    atlasBody = buildHailuo23AtlasBody({
      model,
      prompt,
      durationSec,
      imageUrl: action === "image" ? image_url : undefined,
      enablePromptExpansion: body.enable_prompt_expansion !== false
    });
  } else {
    // Kling, Veo, Wan — `aspect_ratio` + `resolution` on flat body.
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

  if (isWan26AtlasModel(model)) {
    applyWan26ShotTypeFields(atlasBody, normalizeWan26ShotType(body.shot_type));
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[generate-video] Atlas request", {
      videoModel,
      action,
      model,
      seedanceI2v,
      hasImage: Boolean(atlasBody.image),
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

  const charge = await deductCreditsForPrediction({
    userId: actor.userId,
    predictionId,
    amount: creditCost,
    featureUsed: "video"
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
    const videoUrl = extractAtlasVideoOutputUrl(createJson.data);
    if (videoUrl) {
      return NextResponse.json({
        video_url: videoUrl,
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
      hostIsProduction: process.env.VERCEL_ENV === "production",
      action:
        action === "image" ? "image" : action === "reference" ? "reference" : "text"
    });
    return NextResponse.json(
      { error: err, atlas_error: atlasRaw, atlas_model: model, prediction_id: predictionId },
      { status: 502 }
    );
  }

  const atlasImage =
    typeof atlasBody.image === "string"
      ? atlasBody.image
      : typeof atlasBody.image_url === "string"
        ? atlasBody.image_url
        : null;

  const atlasDebug = {
    model,
    action,
    atlas_model_slug: model,
    has_image: Boolean(atlasImage),
    has_last_image: typeof atlasBody.last_image === "string",
    reference_image_count: Array.isArray(atlasBody.reference_images)
      ? (atlasBody.reference_images as string[]).length
      : 0,
    image_host: atlasImage
      ? (() => {
          try {
            return new URL(atlasImage).host;
          } catch {
            return "invalid-url";
          }
        })()
      : null,
    ...(seedanceDimensions && seedanceRequestDims && atlasBody.width != null && atlasBody.height != null
      ? {
          width: atlasBody.width,
          height: atlasBody.height,
          logical_width: seedanceRequestDims.logical.width,
          logical_height: seedanceRequestDims.logical.height,
          seedance_i2v: seedanceI2v,
          dimensions_swapped: seedanceRouteAction === "text" && aspectRatio === "9:16"
        }
      : {
          aspect_ratio: aspectRatio,
          resolution
        }),
    aspect_ratio: aspectRatio,
    generate_audio: applyNativeAudio ? generateAudio : undefined
  };

  return NextResponse.json({
    pending: true,
    prediction_id: predictionId,
    poll_interval_ms: CLIENT_POLL_HINT_MS,
    atlas_model: model,
    atlas_request: atlasDebug,
    credits_spent: creditsSpent,
    credits_balance: charge.balanceAfter
  });
}
