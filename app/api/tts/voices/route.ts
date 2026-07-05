import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { TTS_DEFAULT_VOICES } from "@/lib/tts/constants";
import { fetchMinimaxVoiceLibrary } from "@/lib/tts/providers/minimax/voice-library";
import { ACTIVE_TTS_PROVIDER_ID } from "@/lib/tts/providers/registry";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `tts-voices:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const apiKey = env.minimaxApiKey;
  if (!apiKey) {
    return NextResponse.json({
      voices: TTS_DEFAULT_VOICES,
      source: "fallback",
      provider: ACTIVE_TTS_PROVIDER_ID,
      warning: "Speech voices are not configured (missing MINIMAX_API_KEY)"
    });
  }

  try {
    const { voices, categories } = await fetchMinimaxVoiceLibrary({ apiKey });
    return NextResponse.json({
      voices,
      source: ACTIVE_TTS_PROVIDER_ID,
      provider: ACTIVE_TTS_PROVIDER_ID,
      categories
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load voices";
    return NextResponse.json(
      {
        voices: TTS_DEFAULT_VOICES,
        source: "fallback",
        provider: ACTIVE_TTS_PROVIDER_ID,
        warning: message
      },
      { status: 200 }
    );
  }
}
