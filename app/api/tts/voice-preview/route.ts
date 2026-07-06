import { NextResponse } from "next/server";

import { env, requireMinimaxApiKey } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { getCachedVoicePreview } from "@/lib/tts/voice-library/preview-cache";
import { clampTtsSpeed, TTS_SPEED_DEFAULT } from "@/lib/tts/constants";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `tts-voice-preview:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  if (!env.minimaxApiKey) {
    return NextResponse.json({ error: "Voice preview is not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const voiceId = url.searchParams.get("voice_id")?.trim();
  if (!voiceId) {
    return NextResponse.json({ error: "Missing voice_id" }, { status: 400 });
  }

  const modelId = url.searchParams.get("model_id")?.trim() || MINIMAX_TTS_MODEL_ID;
  const speedRaw = url.searchParams.get("speed");
  const speed =
    speedRaw != null && speedRaw.trim() !== ""
      ? clampTtsSpeed(Number(speedRaw))
      : TTS_SPEED_DEFAULT;

  try {
    const { audio, contentType, cached } = await getCachedVoicePreview({
      voiceId,
      apiKey: requireMinimaxApiKey(),
      modelId,
      speed
    });

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Voice-Preview-Cached": cached ? "1" : "0"
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voice preview failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
