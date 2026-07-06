import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { TTS_DEFAULT_VOICES } from "@/lib/tts/constants";
import { countVoicesByCategory } from "@/lib/tts/voice-library/categories";
import { enrichVoiceMetadata, sortVoicesForLibrary } from "@/lib/tts/voice-library/metadata";
import { buildVoiceLibraryFacets } from "@/lib/tts/voice-library/filters";
import { getCachedTtsVoiceLibrary } from "@/lib/tts/voice-library/server-cache";
import { ACTIVE_TTS_PROVIDER_ID } from "@/lib/tts/providers/registry";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `tts-voices:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  const apiKey = env.minimaxApiKey;
  if (!apiKey) {
    const voices = sortVoicesForLibrary(TTS_DEFAULT_VOICES.map((v) => enrichVoiceMetadata(v)));
    return NextResponse.json(
      {
        voices,
        source: "fallback",
        provider: ACTIVE_TTS_PROVIDER_ID,
        categories: ["system"],
        counts: countVoicesByCategory(voices),
        facets: buildVoiceLibraryFacets(voices),
        warning: "Speech voices are not configured (missing MINIMAX_API_KEY)"
      },
      {
        headers: { "Cache-Control": "private, max-age=60" }
      }
    );
  }

  try {
    const { voices, categories, facets, cached } = await getCachedTtsVoiceLibrary({
      apiKey,
      forceRefresh
    });

    return NextResponse.json(
      {
        voices,
        source: "minimax",
        provider: ACTIVE_TTS_PROVIDER_ID,
        categories,
        counts: countVoicesByCategory(voices),
        facets,
        cached
      },
      {
        headers: {
          "Cache-Control": cached
            ? "private, max-age=300, stale-while-revalidate=600"
            : "private, max-age=60"
        }
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load voices";
    const voices = sortVoicesForLibrary(TTS_DEFAULT_VOICES.map((v) => enrichVoiceMetadata(v)));
    return NextResponse.json(
      {
        voices,
        source: "fallback",
        provider: ACTIVE_TTS_PROVIDER_ID,
        categories: ["system"],
        counts: countVoicesByCategory(voices),
        facets: buildVoiceLibraryFacets(voices),
        warning: message
      },
      { status: 200, headers: { "Cache-Control": "private, max-age=60" } }
    );
  }
}
