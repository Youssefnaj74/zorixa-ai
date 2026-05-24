import { NextResponse } from "next/server";

import {
  ELEVENLABS_DEFAULT_VOICES,
  fetchElevenLabsVoices
} from "@/lib/elevenlabs-client";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `elevenlabs-voices:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const apiKey = env.elevenLabsApiKey;
  if (!apiKey) {
    return NextResponse.json({
      voices: ELEVENLABS_DEFAULT_VOICES,
      source: "fallback"
    });
  }

  try {
    const voices = await fetchElevenLabsVoices(apiKey);
    const sorted = [...voices].sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({
      voices: sorted,
      source: "elevenlabs",
      note: "Free ElevenLabs API plans support default (premade) voices only. Voice Library voices require a paid subscription."
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load voices";
    return NextResponse.json(
      { voices: ELEVENLABS_DEFAULT_VOICES, source: "fallback", warning: message },
      { status: 200 }
    );
  }
}
