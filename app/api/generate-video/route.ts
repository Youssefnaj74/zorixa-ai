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

  // Atlas `generateVideo` flat body (see https://www.atlascloud.ai/docs/en/models/video).
  const atlasBody: Record<string, unknown> = {
    model,
    prompt,
    duration: 5,
    fps: 24,
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

  if (process.env.NODE_ENV === "development") {
    console.log("[generate-video] Atlas request", {
      videoModel,
      action,
      model,
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
    "| resolution:",
    atlasBody.resolution
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

    if (status === "completed") {
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
