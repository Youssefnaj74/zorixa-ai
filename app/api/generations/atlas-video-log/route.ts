import { NextResponse } from "next/server";

import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PLACEHOLDER_INPUT =
  "https://placehold.co/640x360/0d0d12/a78bfa?text=Zorixa+Video+Studio";

/**
 * Records a completed Atlas video from the public video composer (no extra credit charge).
 * `input_url` should be the source still / clip URL when available so dashboard history can show a poster.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `atlas-video-log:${ip}`, limit: 40, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { output_url?: string; input_url?: string; prediction_id?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outputRaw = typeof body.output_url === "string" ? body.output_url.trim() : "";
  const inputRaw = typeof body.input_url === "string" ? body.input_url.trim() : "";

  const output_url = coerceToPublicHttpsUrl(outputRaw);
  if (!output_url) {
    return NextResponse.json(
      { error: "output_url must be a public https:// URL" },
      { status: 400 }
    );
  }

  const coercedInput = inputRaw ? coerceToPublicHttpsUrl(inputRaw) : null;
  const inputFinal = coercedInput ?? PLACEHOLDER_INPUT;

  const prediction_id =
    typeof body.prediction_id === "string" && body.prediction_id.trim().length > 0
      ? body.prediction_id.trim()
      : null;

  const { error: insErr } = await supabaseAdmin.from("generations").insert({
    user_id: user.id,
    feature_type: "video",
    input_url: inputFinal,
    output_url,
    provider: "atlas",
    provider_prediction_id: prediction_id,
    credits_spent: 0,
    status: "completed"
  });

  if (insErr) {
    return NextResponse.json({ error: "Failed to save generation" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
