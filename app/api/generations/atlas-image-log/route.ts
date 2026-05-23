import { NextResponse } from "next/server";

import { logAtlasImageGenerationIfNew } from "@/lib/atlas-image-generation-log";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { rateLimit } from "@/lib/rate-limit";
import { resolveZorixaActor } from "@/lib/zorixa-mcp-auth";

/**
 * Records a completed Atlas image from the public image composer (no extra credit charge).
 * `input_url` should be a reference still when available so dashboard history can show context.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `atlas-image-log:${ip}`, limit: 40, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const actor = await resolveZorixaActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    output_url?: string;
    input_url?: string;
    prediction_id?: string | null;
    image_model?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outputRaw = typeof body.output_url === "string" ? body.output_url.trim() : "";
  if (!coerceToPublicHttpsUrl(outputRaw)) {
    return NextResponse.json(
      { error: "output_url must be a public https:// URL" },
      { status: 400 }
    );
  }

  const inputRaw = typeof body.input_url === "string" ? body.input_url.trim() : "";
  const prediction_id =
    typeof body.prediction_id === "string" && body.prediction_id.trim().length > 0
      ? body.prediction_id.trim()
      : null;

  const image_model =
    typeof body.image_model === "string" && body.image_model.trim().length > 0
      ? body.image_model.trim()
      : null;

  const ok = await logAtlasImageGenerationIfNew({
    userId: actor.userId,
    outputUrl: outputRaw,
    inputUrl: inputRaw || null,
    predictionId: prediction_id,
    composerModelId: image_model
  });

  if (!ok) {
    return NextResponse.json({ error: "Failed to save generation" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
