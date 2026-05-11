import { NextResponse } from "next/server";

import {
  type AtlasVideoRouteAction,
  resolveAtlasVideoModelId
} from "@/lib/atlas-video-model-ids";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const POLL_MS = 3000;
const MAX_WAIT_MS = 15 * 60 * 1000;

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

/**
 * ByteDance Seedance on Atlas: `/docs/models/video` I2V uses flat `model` + `prompt` + `image_url`;
 * model pages also show `width` / `height` / `duration` / `fps`. Multimodal `content` (image + text
 * parts) is required by the live API for some Seedance slugs — send both shapes together for I2V.
 * @see https://www.atlascloud.ai/docs/models/video (Image-to-Video)
 */
function isByteDanceSeedanceAtlasModel(model: string): boolean {
  return (
    model.startsWith("bytedance/seedance-2.0/") ||
    model.startsWith("bytedance/seedance-v1.5-pro/")
  );
}

function isAtlasImageToVideoSlug(model: string): boolean {
  return model.endsWith("/image-to-video");
}

type SeedanceI2vContentPart =
  | { type: "image_url"; image_url: { url: string } }
  | { type: "text"; text: string };

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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
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

  const durationSec = 5;
  const fps = 24;

  let atlasBody: Record<string, unknown>;

  const seedanceI2v =
    isByteDanceSeedanceAtlasModel(model) &&
    isAtlasImageToVideoSlug(model) &&
    Boolean(image_url);

  if (seedanceI2v) {
    const { width, height } = dimensionsForAspectResolution(aspectRatio, resolution);
    const content: SeedanceI2vContentPart[] = [
      { type: "image_url", image_url: { url: image_url } },
      { type: "text", text: prompt }
    ];
    // Flat fields per https://www.atlascloud.ai/docs/models/video + dimensions from model pages.
    atlasBody = {
      model,
      prompt,
      image_url,
      image: image_url,
      duration: durationSec,
      fps,
      aspect_ratio: aspectRatio,
      aspectRatio,
      resolution,
      width,
      height,
      content
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
      envelope: seedanceI2v ? "seedance-i2v(flat+content[])" : "flat",
      aspectRatio,
      resolution,
      keys: Object.keys(atlasBody),
      promptLen: prompt.length
    });
  }

  console.log(
    "[generate-video] Atlas generateVideo payload — videoModel:",
    videoModel,
    "→ model:",
    model,
    "| envelope:",
    seedanceI2v ? "seedance-i2v(flat+content[])" : "flat",
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

  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    const pollRes = await fetch(`${ATLAS_BASE}/prediction/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    const pollJson = (await pollRes.json()) as AtlasEnvelope;
    if (!pollRes.ok) {
      return NextResponse.json(
        {
          error:
            pollJson.message ?? `Prediction poll failed (${pollRes.status})`
        },
        { status: pollRes.status >= 400 ? pollRes.status : 502 }
      );
    }

    const status = pollJson.data?.status;

    if (status === "completed" || status === "succeeded") {
      const outputs = pollJson.data?.outputs;
      const videoUrl = outputs?.[0];
      if (!videoUrl) {
        return NextResponse.json(
          { error: "Completed prediction had no output URL" },
          { status: 502 }
        );
      }
      return NextResponse.json({ video_url: videoUrl });
    }

    if (status === "failed") {
      const err =
        pollJson.data?.error ??
        pollJson.message ??
        "Atlas prediction failed";
      return NextResponse.json({ error: err }, { status: 502 });
    }

    await sleep(POLL_MS);
  }

  return NextResponse.json(
    { error: "Video generation timed out while polling prediction status" },
    { status: 504 }
  );
}
