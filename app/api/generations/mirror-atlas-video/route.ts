import { NextResponse } from "next/server";

import { mirrorAtlasVideoAfterPlaybackConfirmed } from "@/lib/mirror-atlas-video-to-storage";
import { rateLimit } from "@/lib/rate-limit";
import { resolveZorixaActor } from "@/lib/zorixa-mcp-auth";

/** Mirror Atlas CDN output to Supabase after the browser confirms inline playback. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `mirror-atlas-video:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const actor = await resolveZorixaActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { generation_id?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const generationId =
    typeof body.generation_id === "number" && Number.isFinite(body.generation_id)
      ? Math.round(body.generation_id)
      : null;
  if (!generationId || generationId < 1) {
    return NextResponse.json({ error: "generation_id must be a positive integer" }, { status: 400 });
  }

  const mirrored = await mirrorAtlasVideoAfterPlaybackConfirmed({
    userId: actor.userId,
    generationId
  });

  return NextResponse.json({ ok: mirrored });
}
