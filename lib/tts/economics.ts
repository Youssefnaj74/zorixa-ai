import { CREDIT_RETAIL_USD } from "@/lib/atlas-pricing-catalog";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { minimaxTtsModelLabel } from "@/lib/tts/providers/minimax/constants";

/** MiniMax direct API pay-as-you-go (USD per character). */
const MINIMAX_HD_USD_PER_CHAR = 100 / 1_000_000;
const MINIMAX_TURBO_USD_PER_CHAR = 60 / 1_000_000;

function roundUsd(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

export function minimaxTtsProviderCostUsd(args: {
  usageCharacters: number;
  modelId?: string;
}): number {
  const chars = Math.max(0, Math.round(args.usageCharacters));
  const model = (args.modelId ?? "speech-02-hd").toLowerCase();
  const rate = model.includes("turbo") ? MINIMAX_TURBO_USD_PER_CHAR : MINIMAX_HD_USD_PER_CHAR;
  return roundUsd(chars * rate);
}

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
  const creditsCharged = Math.max(0, Math.round(input.creditsCharged));
  const revenueUsd = roundUsd(creditsCharged * CREDIT_RETAIL_USD);
  const providerCostUsd = minimaxTtsProviderCostUsd({
    usageCharacters: input.usageCharacters,
    modelId: input.modelId
  });
  const grossProfitUsd = roundUsd(revenueUsd - providerCostUsd);
  const profitMarginPct =
    revenueUsd > 0 ? Math.round(((grossProfitUsd / revenueUsd) * 100) * 100) / 100 : 0;

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
    credits_charged: creditsCharged,
    revenue_usd: revenueUsd,
    provider_cost_usd: providerCostUsd,
    gross_profit_usd: grossProfitUsd,
    profit_margin_pct: profitMarginPct,
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
