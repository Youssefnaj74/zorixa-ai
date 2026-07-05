import { NextResponse } from "next/server";

import {
  assertCanAfford,
  creditsForTts,
  deductCredits,
  insufficientCreditsResponse
} from "@/lib/credits-charge";
import { env, requireMinimaxApiKey } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { TTS_DEFAULT_VOICES, TTS_MAX_CHARS } from "@/lib/tts/constants";
import { scheduleTtsGenerationEconomics } from "@/lib/tts/economics";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";
import { getActiveTtsProvider } from "@/lib/tts/providers/registry";
import { logTtsGenerationIfNew } from "@/lib/tts-generation-log";
import { resolveZorixaActor } from "@/lib/zorixa-mcp-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ClientBody = {
  text?: string;
  voice_id?: string;
  voiceId?: string;
  model_id?: string;
  speed?: number;
};

const DEFAULT_VOICE_ID = TTS_DEFAULT_VOICES[0]?.voice_id ?? "English_expressive_narrator";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `generate-tts:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const actor = await resolveZorixaActor(request);
  if (!actor) {
    return NextResponse.json({ error: "Sign in to generate speech" }, { status: 401 });
  }

  if (!env.minimaxApiKey) {
    return NextResponse.json(
      { error: "Speech generation is not configured (missing MINIMAX_API_KEY)" },
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
  if (text.length > TTS_MAX_CHARS) {
    return NextResponse.json(
      { error: `Text exceeds ${TTS_MAX_CHARS} characters` },
      { status: 400 }
    );
  }

  const voiceIdRaw =
    (typeof body.voice_id === "string" ? body.voice_id : "") ||
    (typeof body.voiceId === "string" ? body.voiceId : "");
  const voiceId = voiceIdRaw.trim() || DEFAULT_VOICE_ID;
  const modelId =
    typeof body.model_id === "string" && body.model_id.trim().length > 0
      ? body.model_id.trim()
      : MINIMAX_TTS_MODEL_ID;

  const creditCost = creditsForTts({ characterCount: text.length, modelId });
  const afford = await assertCanAfford(actor.userId, creditCost);
  if (!afford.ok) {
    if (afford.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(afford.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const provider = getActiveTtsProvider();
  let synthResult;
  try {
    synthResult = await provider.synthesize(
      {
        text,
        voiceId,
        modelId,
        speed: typeof body.speed === "number" ? body.speed : undefined
      },
      { apiKey: requireMinimaxApiKey() }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Speech generation failed";
    scheduleTtsGenerationEconomics({
      userId: actor.userId,
      traceId: null,
      modelId,
      voiceId,
      creditsCharged: 0,
      usageCharacters: text.length,
      status: "failed"
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const path = `${actor.userId}/${crypto.randomUUID()}.mp3`;
  const chargeRef = `tts:${path}`;

  const bytes = new Uint8Array(synthResult.audio);
  const { error: uploadErr } = await supabaseAdmin.storage.from("uploads").upload(path, bytes, {
    contentType: synthResult.contentType,
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

  const charge = await deductCredits({
    userId: actor.userId,
    amount: creditCost,
    featureUsed: "video",
    refKey: chargeRef
  });
  if (!charge.ok) {
    if (charge.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(charge.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Could not deduct credits" }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from("uploads").getPublicUrl(path);
  const audio_url = data.publicUrl;

  void logTtsGenerationIfNew({
    userId: actor.userId,
    outputUrl: audio_url,
    text,
    voiceId,
    creditsSpent: charge.creditsSpent
  });

  scheduleTtsGenerationEconomics({
    userId: actor.userId,
    traceId: synthResult.traceId ?? null,
    modelId,
    voiceId,
    creditsCharged: charge.creditsSpent,
    usageCharacters: synthResult.usageCharacters,
    status: "success"
  });

  return NextResponse.json({
    audio_url,
    voice_id: voiceId,
    credits_spent: charge.creditsSpent,
    credits_balance: charge.balanceAfter
  });
}
