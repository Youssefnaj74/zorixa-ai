import { NextResponse } from "next/server";

import { createPrediction, extractFirstUrl } from "@/lib/replicate-api";
import { aspectToVideoSize, resolveVideoModelSlug } from "@/lib/replicate-payloads";
import type { AspectRatioId } from "@/lib/studio-constants";
import { CREDIT_COSTS } from "@/lib/replicate";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `video:${ip}`, limit: 15, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    input_url?: string;
    end_image_url?: string;
    description?: string;
    voice_style?: string;
    negative_prompt?: string;
    aspect_ratio?: string;
    model_id?: string;
  };

  if (!body.input_url || !body.end_image_url || !body.description) {
    return NextResponse.json(
      { error: "Missing start image (input_url), end image (end_image_url), or description" },
      { status: 400 }
    );
  }

  const videoModel = resolveVideoModelSlug(body.model_id);
  if (!videoModel) {
    return NextResponse.json(
      {
        error:
          "Missing video model. Set REPLICATE_MODEL_VIDEO in .env. Optional: REPLICATE_MODEL_VIDEO_KLING, REPLICATE_MODEL_VIDEO_LUMA."
      },
      { status: 500 }
    );
  }

  const aspect: AspectRatioId =
    body.aspect_ratio === "9:16" || body.aspect_ratio === "1:1" || body.aspect_ratio === "16:9"
      ? body.aspect_ratio
      : "16:9";
  const dims = aspectToVideoSize(aspect);

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
      input_url: body.input_url,
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
      stripe_payment_id: null,
      feature_used: "video"
    });
  }

  const input: Record<string, unknown> = {
    image: body.input_url,
    end_image: body.end_image_url,
    prompt: body.description,
    voice_style: body.voice_style ?? "friendly",
    width: dims.width,
    height: dims.height
  };
  if (body.negative_prompt?.trim()) {
    input.negative_prompt = body.negative_prompt.trim();
  }

  let pred;
  try {
    pred = await createPrediction(videoModel, input);
  } catch (e: any) {
    await supabaseAdmin.from("generations").update({ status: "failed" }).eq("id", gen.id);
    return NextResponse.json(
      { error: e?.message ?? "Replicate video prediction failed" },
      { status: 500 }
    );
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
    return NextResponse.json({ id: gen.id, status: "completed", output_url: outUrl });
  }

  return NextResponse.json({
    id: gen.id,
    status: "pending",
    credits_spent: videoCost
  });
}
