import { NextResponse } from "next/server";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const POLL_MS = 3000;
const MAX_WAIT_MS = 15 * 60 * 1000;

type GenerateVideoAction = "text" | "image" | "lipsync" | "edit";

type ClientBody = {
  prompt?: string;
  action?: GenerateVideoAction;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
};

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

const DEFAULT_MODEL: Record<GenerateVideoAction, string> = {
  text: "kwaivgi/kling-v3.0-pro/text-to-video",
  image: "kwaivgi/kling-v3.0-pro/image-to-video",
  lipsync: "kwaivgi/kling-v3.0-pro/text-to-video",
  edit: "kwaivgi/kling-v3.0-pro/text-to-video"
};

function modelForAction(action: GenerateVideoAction): string {
  const envMap: Record<GenerateVideoAction, string | undefined> = {
    text: process.env.ATLASCLOUD_KLING_T2V_MODEL,
    image: process.env.ATLASCLOUD_KLING_I2V_MODEL,
    lipsync: process.env.ATLASCLOUD_KLING_LIPSYNC_MODEL,
    edit: process.env.ATLASCLOUD_KLING_VIDEO_EDIT_MODEL
  };
  const fromEnv = envMap[action]?.trim();
  return fromEnv || DEFAULT_MODEL[action];
}

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

  const model = modelForAction(action);

  // Atlas `generateVideo` expects a flat body: `model`, `prompt`, and optional params
  // (see https://www.atlascloud.ai/docs/en/models/video). Nesting under `input` leaves
  // top-level `prompt` empty and Atlas returns "prompt cannot be empty".
  const atlasBody: Record<string, unknown> = {
    model,
    prompt,
    duration: 5,
    fps: 24
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
    console.log("[generate-video] Atlas request (keys + prompt length)", {
      action,
      model,
      keys: Object.keys(atlasBody),
      promptLen: prompt.length
    });
  }

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
