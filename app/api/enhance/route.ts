import { NextResponse } from "next/server";

import { extractFirstUrl } from "@/lib/replicate-api";
import {
  createEnhancePrediction,
  type EnhanceRouteModel
} from "@/lib/replicate-payloads";
import type { AspectRatioId, UpscaleTier } from "@/lib/studio-constants";
import { CREDIT_COSTS } from "@/lib/replicate";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ENHANCE_MODELS = new Set<string>(["real_esrgan", "codeformer", "rembg", "sdxl"]);

function mapLegacyEnhancement(enhancement?: string): EnhanceRouteModel {
  switch (enhancement) {
    case "upscale":
      return "real_esrgan";
    case "remove_background":
      return "rembg";
    case "remove_noise":
    case "enhance_quality":
    default:
      return "codeformer";
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `enhance:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    input_url?: string;
    enhancement?: string;
    upscale?: string;
    model?: string;
    prompt?: string;
    negative_prompt?: string;
    aspect_ratio?: string;
  };

  if (!body.input_url) return NextResponse.json({ error: "Missing input_url" }, { status: 400 });

  let model: EnhanceRouteModel = mapLegacyEnhancement(body.enhancement);
  if (body.model && ENHANCE_MODELS.has(body.model)) {
    model = body.model as EnhanceRouteModel;
  }

  const upscaleTier = (body.upscale === "4x" || body.upscale === "8x" ? body.upscale : "2x") as UpscaleTier;

  if (model === "sdxl") {
    const p = body.prompt?.trim();
    if (!p) {
      return NextResponse.json(
        { error: "Prompt is required for Stable Diffusion XL creative edits." },
        { status: 400 }
      );
    }
  }

  const aspect =
    body.aspect_ratio === "9:16" || body.aspect_ratio === "16:9" || body.aspect_ratio === "1:1"
      ? (body.aspect_ratio as AspectRatioId)
      : undefined;

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile)
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const enhanceCost = CREDIT_COSTS.enhance;
  if (enhanceCost > 0 && profile.credits_balance < enhanceCost) {
    return NextResponse.json({ error: "INSUFFICIENT_CREDITS" }, { status: 402 });
  }

  const { data: gen, error: genErr } = await supabaseAdmin
    .from("generations")
    .insert({
      user_id: user.id,
      feature_type: "image",
      input_url: body.input_url,
      output_url: null,
      provider: "replicate",
      provider_prediction_id: null,
      credits_spent: enhanceCost,
      status: "pending"
    })
    .select("id")
    .single();

  if (genErr || !gen) return NextResponse.json({ error: "Failed to create job" }, { status: 500 });

  if (enhanceCost > 0) {
    await supabaseAdmin
      .from("users_profiles")
      .update({ credits_balance: profile.credits_balance - enhanceCost })
      .eq("id", user.id);

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "usage",
      credits_amount: -enhanceCost,
      stripe_payment_id: null,
      feature_used: "enhance"
    });
  }

  let pred;
  try {
    pred = await createEnhancePrediction(model, body.input_url, {
      upscale: upscaleTier,
      prompt: body.prompt,
      negativePrompt: body.negative_prompt,
      aspect
    });
  } catch (e: any) {
    await supabaseAdmin.from("generations").update({ status: "failed" }).eq("id", gen.id);
    return NextResponse.json(
      { error: e?.message ?? "Replicate prediction failed" },
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
    credits_spent: enhanceCost
  });
}
