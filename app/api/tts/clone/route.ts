import { NextResponse } from "next/server";

import {
  assertCanAfford,
  deductCredits,
  insufficientCreditsResponse
} from "@/lib/credits-charge";
import { env, requireMinimaxApiKey } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { insertUserClonedVoice } from "@/lib/tts/cloned-voices-db";
import { loadDemoAudioBytes } from "@/lib/tts/demo-audio";
import {
  isTtsCloneAudioExtension,
  TTS_CLONE_ACTIVATION_TEXT,
  TTS_CLONE_MAX_BYTES,
  TTS_CLONE_MAX_DURATION_SEC,
  TTS_CLONE_MIN_DURATION_SEC
} from "@/lib/tts/constants";
import { scheduleTtsGenerationEconomics, scheduleVoiceCloneEconomics } from "@/lib/tts/economics";
import { creditsChargedForVoiceClone } from "@/lib/tts/pricing";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";
import {
  cloneMinimaxVoice,
  generateZorixaCloneVoiceId
} from "@/lib/tts/providers/minimax/voice-clone";
import { resolveZorixaActor } from "@/lib/zorixa-mcp-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `tts-clone:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const actor = await resolveZorixaActor(request);
  if (!actor) {
    return NextResponse.json({ error: "Sign in to clone a voice" }, { status: 401 });
  }

  if (!env.minimaxApiKey) {
    return NextResponse.json(
      { error: "Voice cloning is not configured (missing MINIMAX_API_KEY)" },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const displayName = typeof form.get("name") === "string" ? form.get("name")!.trim() : "";
  const modelId =
    typeof form.get("model_id") === "string" && form.get("model_id")!.trim()
      ? form.get("model_id")!.trim()
      : MINIMAX_TTS_MODEL_ID;
  const durationRaw = form.get("duration_sec");
  const durationSec =
    typeof durationRaw === "string" && durationRaw.trim()
      ? Number(durationRaw)
      : typeof durationRaw === "number"
        ? durationRaw
        : NaN;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  if (!displayName || displayName.length > 80) {
    return NextResponse.json({ error: "Enter a voice name (1–80 characters)." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!isTtsCloneAudioExtension(ext)) {
    return NextResponse.json(
      { error: "Use MP3, M4A, or WAV audio (10 seconds to 5 minutes)." },
      { status: 400 }
    );
  }

  if (file.size > TTS_CLONE_MAX_BYTES) {
    return NextResponse.json({ error: "Audio must be under 20 MB." }, { status: 400 });
  }

  if (Number.isFinite(durationSec)) {
    if (durationSec < TTS_CLONE_MIN_DURATION_SEC || durationSec > TTS_CLONE_MAX_DURATION_SEC) {
      return NextResponse.json(
        {
          error: `Audio must be between ${TTS_CLONE_MIN_DURATION_SEC} seconds and ${TTS_CLONE_MAX_DURATION_SEC / 60} minutes.`
        },
        { status: 400 }
      );
    }
  }

  const creditCost = creditsChargedForVoiceClone(modelId);
  const afford = await assertCanAfford(actor.userId, creditCost);
  if (!afford.ok) {
    if (afford.error === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(insufficientCreditsResponse(afford.balance, creditCost), {
        status: 402
      });
    }
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const storagePath = `${actor.userId}/clone-source/${crypto.randomUUID()}.${ext}`;
  const { error: uploadErr } = await supabaseAdmin.storage.from("uploads").upload(storagePath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  let sourceAudioUrl: string | null = null;
  if (!uploadErr) {
    const { data } = supabaseAdmin.storage.from("uploads").getPublicUrl(storagePath);
    sourceAudioUrl = data.publicUrl;
  }

  const voiceId = generateZorixaCloneVoiceId();
  const chargeRef = `tts-clone:${voiceId}`;

  let cloneResult;
  try {
    cloneResult = await cloneMinimaxVoice(
      {
        file: file,
        filename: file.name || `clone.${ext}`,
        voiceId,
        modelId,
        activationText: TTS_CLONE_ACTIVATION_TEXT
      },
      requireMinimaxApiKey()
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voice cloning failed";
    scheduleVoiceCloneEconomics({
      userId: actor.userId,
      modelId,
      voiceId,
      creditsCharged: 0,
      status: "failed"
    });
    return NextResponse.json({ error: message }, { status: 502 });
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

  let row;
  let demoAudioUrl = cloneResult.demoAudioUrl;
  if (demoAudioUrl) {
    try {
      const { bytes, contentType } = await loadDemoAudioBytes(demoAudioUrl);
      const demoPath = `${actor.userId}/clone-demo/${voiceId}.mp3`;
      const { error: demoUploadErr } = await supabaseAdmin.storage.from("uploads").upload(demoPath, bytes, {
        contentType,
        upsert: true
      });
      if (!demoUploadErr) {
        const { data } = supabaseAdmin.storage.from("uploads").getPublicUrl(demoPath);
        demoAudioUrl = data.publicUrl;
      }
    } catch {
      // Keep MiniMax URL if persistence fails.
    }
  }

  try {
    row = await insertUserClonedVoice({
      userId: actor.userId,
      voiceId,
      displayName,
      sourceAudioUrl,
      demoAudioUrl,
      modelId,
      status: "active",
      activatedAt: new Date().toISOString()
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save cloned voice";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  scheduleVoiceCloneEconomics({
    userId: actor.userId,
    modelId,
    voiceId,
    creditsCharged: charge.creditsSpent,
    status: "success"
  });

  return NextResponse.json({
    voice: row,
    voice_id: voiceId,
    credits_spent: charge.creditsSpent,
    credits_balance: charge.balanceAfter,
    demo_audio_url: row.demo_audio_url ?? demoAudioUrl
  });
}
