import { NextResponse } from "next/server";

import {
  ELEVENLABS_DEFAULT_VOICES,
  ELEVENLABS_TTS_MAX_CHARS,
  synthesizeElevenLabsSpeech
} from "@/lib/elevenlabs-client";
import { env, requireElevenLabsApiKey } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { logTtsGenerationIfNew } from "@/lib/tts-generation-log";
import { resolveZorixaActor } from "@/lib/zorixa-mcp-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ClientBody = {
  text?: string;
  voice_id?: string;
  voiceId?: string;
  model_id?: string;
  stability?: number;
  similarity_boost?: number;
};

const DEFAULT_VOICE_ID = ELEVENLABS_DEFAULT_VOICES[0]?.voice_id ?? "21m00Tcm4TlvDq8ikWAM";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `generate-tts:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const actor = await resolveZorixaActor(request);
  if (!actor) {
    return NextResponse.json({ error: "Sign in to generate speech" }, { status: 401 });
  }

  if (!env.elevenLabsApiKey) {
    return NextResponse.json(
      { error: "Speech generation is not configured (missing ELEVENLABS_API_KEY)" },
      { status: 503 }
    );
  }

  let body: ClientBody;
  try {
    body = (await request.json()) as ClientBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }
  if (text.length > ELEVENLABS_TTS_MAX_CHARS) {
    return NextResponse.json(
      { error: `Text exceeds ${ELEVENLABS_TTS_MAX_CHARS} characters` },
      { status: 400 }
    );
  }

  const voiceIdRaw =
    (typeof body.voice_id === "string" ? body.voice_id : "") ||
    (typeof body.voiceId === "string" ? body.voiceId : "");
  const voiceId = voiceIdRaw.trim() || DEFAULT_VOICE_ID;

  let audioBuffer: ArrayBuffer;
  try {
    audioBuffer = await synthesizeElevenLabsSpeech(
      {
        text,
        voiceId,
        modelId: typeof body.model_id === "string" ? body.model_id.trim() : undefined,
        stability: typeof body.stability === "number" ? body.stability : undefined,
        similarityBoost:
          typeof body.similarity_boost === "number" ? body.similarity_boost : undefined
      },
      requireElevenLabsApiKey()
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Speech generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const path = `${actor.userId}/${crypto.randomUUID()}.mp3`;
  const bytes = new Uint8Array(audioBuffer);
  const { error: uploadErr } = await supabaseAdmin.storage.from("uploads").upload(path, bytes, {
    contentType: "audio/mpeg",
    upsert: false
  });

  if (uploadErr) {
    return NextResponse.json(
      {
        error:
          "Upload failed. Ensure you created a Supabase Storage bucket named 'uploads'."
      },
      { status: 500 }
    );
  }

  const { data } = supabaseAdmin.storage.from("uploads").getPublicUrl(path);
  const audio_url = data.publicUrl;

  void logTtsGenerationIfNew({
    userId: actor.userId,
    outputUrl: audio_url,
    text,
    voiceId
  });

  return NextResponse.json({ audio_url, voice_id: voiceId });
}
