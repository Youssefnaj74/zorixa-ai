import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { listUserClonedVoices } from "@/lib/tts/cloned-voices-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `tts-cloned-voices:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to view cloned voices" }, { status: 401 });
  }

  try {
    const voices = await listUserClonedVoices(user.id);
    return NextResponse.json({ voices });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load cloned voices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
