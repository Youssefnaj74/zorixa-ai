import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateTtsEconomicsSnapshot } from "@/lib/tts/pricing";
import { minimaxTtsModelLabel } from "@/lib/tts/providers/minimax/constants";

export { minimaxTtsProviderCostUsd } from "@/lib/tts/pricing";

export type TtsGenerationEconomicsInput = {
  userId: string;
  generationId?: number | null;
  traceId?: string | null;
  modelId: string;
  voiceId?: string | null;
  creditsCharged: number;
  usageCharacters: number;
  status?: "success" | "failed";
};

/** Persists TTS unit economics with provider_used = "minimax". */
export async function logTtsGenerationEconomics(input: TtsGenerationEconomicsInput): Promise<void> {
  const snap = calculateTtsEconomicsSnapshot({
    creditsCharged: input.creditsCharged,
    usageCharacters: input.usageCharacters,
    modelId: input.modelId
  });

  const traceId =
    typeof input.traceId === "string" && input.traceId.trim().length > 0
      ? input.traceId.trim()
      : null;

  const row = {
    user_id: input.userId,
    generation_id: input.generationId ?? null,
    prediction_id: traceId ? `minimax-tts:${traceId}` : null,
    composer_model_id: input.modelId,
    model_label: minimaxTtsModelLabel(input.modelId),
    workflow: "Text to Speech",
    provider_used: "minimax",
    provider_attempted: null,
    fallback_used: false,
    fallback_reason: null,
    generation_status: input.status ?? "success",
    resolution: input.voiceId?.trim() || null,
    aspect_ratio: null,
    duration_sec: null,
    generate_audio: null,
    speed_tier: null,
    credits_charged: snap.creditsCharged,
    revenue_usd: snap.revenueUsd,
    provider_cost_usd: snap.providerCostUsd,
    gross_profit_usd: snap.grossProfitUsd,
    profit_margin_pct: snap.profitMarginPct,
    updated_at: new Date().toISOString()
  };

  if (row.prediction_id) {
    const { data: existing } = await supabaseAdmin
      .from("generation_economics")
      .select("id")
      .eq("prediction_id", row.prediction_id)
      .maybeSingle();
    if (existing?.id) {
      await supabaseAdmin.from("generation_economics").update(row).eq("id", existing.id);
      return;
    }
  }

  const { error } = await supabaseAdmin.from("generation_economics").insert(row);
  if (error && process.env.NODE_ENV === "development") {
    console.error("[tts-economics] insert failed", error.message);
  }
}

/** Fire-and-forget TTS economics log. */
export function scheduleTtsGenerationEconomics(input: TtsGenerationEconomicsInput): void {
  void logTtsGenerationEconomics(input).catch((err) => {
    console.error("[tts-economics] upsert error", err);
  });
}
