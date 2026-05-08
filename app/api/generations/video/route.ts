import { NextResponse } from "next/server";

import { createPrediction, extractFirstUrl } from "@/lib/replicate-api";
import { CREDIT_COSTS } from "@/lib/replicate";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Replicate img2vid — image + motion controls. */
const SVD_MODEL =
  process.env.REPLICATE_MODEL_STABLE_VIDEO ?? "stability-ai/stable-video-diffusion";

function clampInt(n: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Map UI fps (6–30) to Replicate `decoding_t` (roughly controls decoded frame span). */
function fpsToDecodingT(fps: number): number {
  const f = clampInt(fps, 6, 30, 12);
  return clampInt(6 + ((f - 6) / 24) * 10, 3, 20, 10);
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `generations-video:${ip}`, limit: 12, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file (field: image)" }, { status: 400 });
  }

  const motionRaw = form.get("motion_bucket_id");
  const fpsRaw = form.get("fps");
  const motion_bucket_id = clampInt(
    typeof motionRaw === "string" ? Number.parseInt(motionRaw, 10) : Number.NaN,
    1,
    255,
    127
  );
  const fps = clampInt(
    typeof fpsRaw === "string" ? Number.parseInt(fpsRaw, 10) : Number.NaN,
    6,
    30,
    12
  );
  const decoding_t = fpsToDecodingT(fps);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from("uploads")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadErr) {
    return NextResponse.json(
      { error: "Upload failed. Ensure Storage bucket 'uploads' exists." },
      { status: 500 }
    );
  }

  const { data: pub } = supabaseAdmin.storage.from("uploads").getPublicUrl(path);
  const inputUrl = pub.publicUrl;

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile)
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const videoCost = CREDIT_COSTS.video;
  if (videoCost > 0 && profile.credits_balance < videoCost) {
    return NextResponse.json({ error: "INSUFFICIENT_CREDITS" }, { status: 402 });
  }

  const { data: gen, error: genErr } = await supabaseAdmin
    .from("generations")
    .insert({
      user_id: user.id,
      feature_type: "video",
      input_url: inputUrl,
      output_url: null,
      provider: "replicate",
      provider_prediction_id: null,
      credits_spent: videoCost,
      status: "pending"
    })
    .select("id")
    .single();

  if (genErr || !gen) return NextResponse.json({ error: "Failed to create job" }, { status: 500 });

  if (videoCost > 0) {
    await supabaseAdmin
      .from("users_profiles")
      .update({ credits_balance: profile.credits_balance - videoCost })
      .eq("id", user.id);

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "usage",
      credits_amount: -videoCost,
      lemonsqueezy_order_id: null,
      feature_used: "video"
    });
  }

  const replicateInput: Record<string, unknown> = {
    image: inputUrl,
    motion_bucket_id,
    cond_aug: 0.02,
    decoding_t
  };

  let pred;
  try {
    pred = await createPrediction(SVD_MODEL, replicateInput);
  } catch (e: unknown) {
    await supabaseAdmin.from("generations").update({ status: "failed" }).eq("id", gen.id);
    const msg = e instanceof Error ? e.message : "Replicate prediction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await supabaseAdmin
    .from("generations")
    .update({ provider_prediction_id: pred.id })
    .eq("id", gen.id);

  if (pred.status === "succeeded") {
    const outUrl = extractFirstUrl(pred.output);
    await supabaseAdmin
      .from("generations")
      .update({ output_url: outUrl, status: "completed" })
      .eq("id", gen.id);
    return NextResponse.json({
      id: gen.id,
      status: "completed",
      output_url: outUrl,
      credits_spent: videoCost,
      motion_bucket_id,
      fps,
      decoding_t
    });
  }

  return NextResponse.json({
    id: gen.id,
    status: "pending",
    credits_spent: videoCost,
    motion_bucket_id,
    fps,
    decoding_t
  });
}
