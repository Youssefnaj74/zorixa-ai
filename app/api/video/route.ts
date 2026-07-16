import { NextResponse } from "next/server";

import { AtlasApiError } from "@/lib/atlas-api";
import { seedanceGenerateVideo } from "@/lib/seedance-video-generate";
import { enforceContentPolicy, requestIp } from "@/lib/content-moderation";
import { CREDIT_COSTS } from "@/lib/replicate";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `video:${ip}`, limit: 15, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const body = (await request.json()) as {
    input_url?: string;
    end_image_url?: string;
    description?: string;
    voice_style?: string;
    negative_prompt?: string;
    aspect_ratio?: string;
    model_id?: string;
    /** Output size tier: 480p | 720p | 1080p */
    resolution?: string;
    /** Clip length in seconds (clamped server-side). */
    duration?: number;
  };

  if (!body.input_url || !body.description?.trim()) {
    return NextResponse.json(
      { error: "Missing start image (input_url) or description" },
      { status: 400 }
    );
  }

  // Policy before auth — reject NSFW text with 422 without provider calls.
  const policyBlock = await enforceContentPolicy({
    userId: null,
    workflow: "legacy_video",
    route: "/api/video",
    texts: [body.description, body.negative_prompt],
    ip: requestIp(request)
  });
  if (policyBlock) return policyBlock;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const aspect_ratio =
    body.aspect_ratio === "9:16" || body.aspect_ratio === "1:1" || body.aspect_ratio === "16:9"
      ? body.aspect_ratio
      : "16:9";

  const resolution =
    typeof body.resolution === "string" && body.resolution.trim()
      ? body.resolution.trim().toLowerCase()
      : "1080p";

  const duration =
    typeof body.duration === "number" && Number.isFinite(body.duration) ? body.duration : 5;

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
      provider: "atlas",
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

  let atlasResult;
  try {
    atlasResult = await seedanceGenerateVideo({
      image_url: body.input_url,
      prompt: body.description.trim(),
      duration,
      aspect_ratio,
      resolution
    });
  } catch (e: unknown) {
    await supabaseAdmin.from("generations").update({ status: "failed" }).eq("id", gen.id);
    if (e instanceof AtlasApiError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode >= 400 ? e.statusCode : 500 });
    }
    const msg = e instanceof Error ? e.message : "Atlas video generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (atlasResult.mode === "sync") {
    await supabaseAdmin
      .from("generations")
      .update({
        provider_prediction_id: null,
        output_url: atlasResult.outputUrl,
        status: "completed"
      })
      .eq("id", gen.id);
    return NextResponse.json({
      id: gen.id,
      status: "completed",
      output_url: atlasResult.outputUrl
    });
  }

  await supabaseAdmin
    .from("generations")
    .update({ provider_prediction_id: atlasResult.predictionId })
    .eq("id", gen.id);

  return NextResponse.json({
    id: gen.id,
    status: "pending",
    credits_spent: videoCost
  });
}
