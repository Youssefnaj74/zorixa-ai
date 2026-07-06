import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { getUserClonedVoice } from "@/lib/tts/cloned-voices-db";
import { loadDemoAudioBytes } from "@/lib/tts/demo-audio";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ voiceId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `tts-cloned-voice-demo:${ip}`, limit: 40, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { voiceId } = await context.params;
  const decodedVoiceId = decodeURIComponent(voiceId).trim();
  if (!decodedVoiceId) {
    return NextResponse.json({ error: "Missing voice id" }, { status: 400 });
  }

  try {
    const voice = await getUserClonedVoice(user.id, decodedVoiceId);
    if (!voice?.demo_audio_url) {
      return NextResponse.json({ error: "Demo audio not found" }, { status: 404 });
    }

    const { bytes, contentType } = await loadDemoAudioBytes(voice.demo_audio_url);

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Demo playback failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
