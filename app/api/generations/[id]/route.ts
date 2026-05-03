import { NextResponse } from "next/server";

import { extractFirstUrl, getPrediction } from "@/lib/replicate-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: gen, error: genErr } = await supabaseAdmin
    .from("generations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (genErr || !gen) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If pending and we have a Replicate prediction id, poll Replicate and update row.
  if (gen.status === "pending" && gen.provider === "replicate" && gen.provider_prediction_id) {
    try {
      const pred = await getPrediction(gen.provider_prediction_id);
      if (pred.status === "succeeded") {
        const outUrl = extractFirstUrl(pred.output);
        await supabaseAdmin
          .from("generations")
          .update({ status: "completed", output_url: outUrl })
          .eq("id", gen.id);
        gen.status = "completed";
        gen.output_url = outUrl;
      } else if (pred.status === "failed" || pred.status === "canceled") {
        await supabaseAdmin.from("generations").update({ status: "failed" }).eq("id", gen.id);
        gen.status = "failed";
      }
    } catch {
      // If polling fails transiently, return current state; client will retry.
    }
  }

  return NextResponse.json({
    id: gen.id,
    status: gen.status,
    input_url: gen.input_url,
    output_url: gen.output_url,
    credits_spent: gen.credits_spent,
    feature_type: gen.feature_type
  });
}

