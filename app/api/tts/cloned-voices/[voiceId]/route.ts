import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { deleteUserClonedVoice, renameUserClonedVoice } from "@/lib/tts/cloned-voices-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ voiceId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `tts-cloned-voice-patch:${ip}`, limit: 30, windowMs: 60_000 });
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

  let body: { display_name?: string };
  try {
    body = (await request.json()) as { display_name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
  if (!displayName || displayName.length > 80) {
    return NextResponse.json({ error: "Name must be 1–80 characters." }, { status: 400 });
  }

  try {
    const voice = await renameUserClonedVoice(user.id, decodedVoiceId, displayName);
    if (!voice) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }
    return NextResponse.json({ voice });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rename failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `tts-cloned-voice-delete:${ip}`, limit: 20, windowMs: 60_000 });
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
    const deleted = await deleteUserClonedVoice(user.id, decodedVoiceId);
    if (!deleted) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
