import { NextResponse } from "next/server";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const POLL_MS = 3000;
const MAX_WAIT_MS = 15 * 60 * 1000;

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

  let body: { prompt?: string };
  try {
    body = (await request.json()) as { prompt?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const createRes = await fetch(`${ATLAS_BASE}/generateVideo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "kwaivgi/kling-v3.0-pro/text-to-video",
      input: {
        prompt,
        duration: 5,
        fps: 24
      }
    })
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
