import { NextResponse } from "next/server";

import { logAtlasVideoGenerationIfNew } from "@/lib/atlas-video-generation-log";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { rateLimit } from "@/lib/rate-limit";
import { resolveZorixaActor } from "@/lib/zorixa-mcp-auth";

/**
 * Records a completed Atlas video from the public video composer (no extra credit charge).
 * `input_url` should be the source still / clip URL when available so dashboard history can show a poster.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `atlas-video-log:${ip}`, limit: 40, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const actor = await resolveZorixaActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    output_url?: string;
    input_url?: string;
    prediction_id?: string | null;
    video_model?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outputRaw = typeof body.output_url === "string" ? body.output_url.trim() : "";
  const inputRaw = typeof body.input_url === "string" ? body.input_url.trim() : "";

  const output_url = coerceToPublicHttpsUrl(outputRaw);
  if (!output_url) {
    return NextResponse.json(
      { error: "output_url must be a public https:// URL" },
      { status: 400 }
    );
  }

  const prediction_id =
    typeof body.prediction_id === "string" && body.prediction_id.trim().length > 0
      ? body.prediction_id.trim()
      : null;

  const video_model =
    typeof body.video_model === "string" && body.video_model.trim().length > 0
      ? body.video_model.trim()
      : null;

  const ok = await logAtlasVideoGenerationIfNew({
    userId: actor.userId,
    outputUrl: output_url,
    inputUrl: inputRaw || null,
    predictionId: prediction_id,
    composerModelId: video_model
  });

  if (!ok) {
    return NextResponse.json({ error: "Failed to save generation" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
