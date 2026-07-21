import type { AtlasVideoRouteAction } from "@/lib/atlas-video-model-ids";
import {
  atlasVideoUsdForOptions,
  CREDIT_RETAIL_USD,
  type VideoPricingOptions
} from "@/lib/atlas-pricing-catalog";
import {
  byteplusSeedanceUsdForOptions,
  type BytePlusCostWorkflow
} from "@/lib/byteplus-pricing-catalog";
import { detectBytePlusSeedanceWorkflow } from "@/lib/byteplus-seedance";
import { isBytePlusPredictionId } from "@/lib/byteplus-api";
import { HAILUO_23_COMPOSER_ID } from "@/lib/atlas-hailuo-video";
import { minimaxHailuo23UsdForOptions } from "@/lib/minimax-hailuo-pricing";
import { isMinimaxVideoPredictionId } from "@/lib/minimax-video-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type VideoProvider = "byteplus" | "atlas" | "minimax";

export type GenerationEconomicsStatus =
  | "pending"
  | "success"
  | "failed"
  | "fallback_to_atlas";

export type GenerationEconomicsInput = {
  userId: string;
  predictionId?: string | null;
  generationId?: number | null;
  composerModelId: string;
  speedTier?: string;
  routeAction: AtlasVideoRouteAction;
  creditsCharged: number;
  providerUsed: VideoProvider;
  providerAttempted?: VideoProvider | null;
  fallbackUsed?: boolean;
  fallbackReason?: string | null;
  status: GenerationEconomicsStatus;
  resolution?: string;
  aspectRatio?: string;
  durationSec?: number;
  generateAudio?: boolean;
  referenceImageCount?: number;
  referenceVideoCount?: number;
  hasSourceVideo?: boolean;
};

export type GenerationEconomicsSnapshot = {
  creditsCharged: number;
  revenueUsd: number;
  providerCostUsd: number;
  grossProfitUsd: number;
  profitMarginPct: number;
  modelLabel: string;
  workflowLabel: string;
  providerUsed: VideoProvider;
};

function workflowLabelFromAction(
  action: AtlasVideoRouteAction,
  input: { hasSourceVideo?: boolean; referenceImageCount?: number }
): string {
  if (action === "text") return "Text to Video";
  if (action === "image") return "Image to Video";
  if (action === "reference") return "Reference to Video";
  if (action === "edit") {
    const hasEditRefs = (input.referenceImageCount ?? 0) > 0;
    return hasEditRefs ? "Video Edit" : "Video Extend";
  }
  if (action === "motion-control") return "Motion Control";
  if (action === "start-end") return "Start-End";
  if (action === "lipsync") return "Audio to Video";
  return action;
}

function modelLabel(composerModelId: string, speedTier?: string): string {
  if (composerModelId === "seedance-2") {
    return speedTier === "fast" ? "Seedance 2.0 Fast" : "Seedance 2.0";
  }
  if (composerModelId === "seedance-1-5") return "Seedance 1.5 Pro";
  if (composerModelId === HAILUO_23_COMPOSER_ID) return "Hailuo 2.3";
  return composerModelId;
}

function bytePlusWorkflowFromAction(
  action: AtlasVideoRouteAction,
  input: { hasSourceVideo?: boolean; referenceImageCount?: number }
): BytePlusCostWorkflow {
  return detectBytePlusSeedanceWorkflow(action, {
    videoUrl: input.hasSourceVideo ? "https://placeholder" : undefined,
    referenceImages:
      (input.referenceImageCount ?? 0) > 0 ? ["https://placeholder"] : undefined
  });
}

function providerCostUsd(input: GenerationEconomicsInput): number {
  const pricingOpts: VideoPricingOptions = {
    durationSeconds: input.durationSec,
    resolution: input.resolution,
    speedTier: input.speedTier,
    generateAudio: input.generateAudio,
    routeAction: input.routeAction
  };

  if (input.providerUsed === "byteplus" && input.composerModelId === "seedance-2") {
    return byteplusSeedanceUsdForOptions({
      ...pricingOpts,
      workflow: bytePlusWorkflowFromAction(input.routeAction, input)
    });
  }

  if (input.providerUsed === "minimax" && input.composerModelId === HAILUO_23_COMPOSER_ID) {
    return minimaxHailuo23UsdForOptions(pricingOpts);
  }

  return atlasVideoUsdForOptions(input.composerModelId, pricingOpts);
}

export function calculateGenerationEconomics(
  input: GenerationEconomicsInput
): GenerationEconomicsSnapshot {
  const creditsCharged = Math.max(0, Math.round(input.creditsCharged));
  const revenueUsd = creditsCharged * CREDIT_RETAIL_USD;
  const costUsd = providerCostUsd(input);
  const grossProfitUsd = revenueUsd - costUsd;
  const profitMarginPct = revenueUsd > 0 ? (grossProfitUsd / revenueUsd) * 100 : 0;

  return {
    creditsCharged,
    revenueUsd: roundUsd(revenueUsd),
    providerCostUsd: roundUsd(costUsd),
    grossProfitUsd: roundUsd(grossProfitUsd),
    profitMarginPct: roundPct(profitMarginPct),
    modelLabel: modelLabel(input.composerModelId, input.speedTier),
    workflowLabel: workflowLabelFromAction(input.routeAction, input),
    providerUsed: input.providerUsed
  };
}

function roundUsd(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100;
}

export function inferProviderFromPredictionId(predictionId: string | null | undefined): VideoProvider {
  if (predictionId && isBytePlusPredictionId(predictionId)) return "byteplus";
  if (predictionId && isMinimaxVideoPredictionId(predictionId)) return "minimax";
  return "atlas";
}

export async function upsertGenerationEconomics(
  input: GenerationEconomicsInput
): Promise<void> {
  const snap = calculateGenerationEconomics(input);
  const predictionId =
    typeof input.predictionId === "string" && input.predictionId.trim()
      ? input.predictionId.trim()
      : null;

  const row = {
    user_id: input.userId,
    generation_id: input.generationId ?? null,
    prediction_id: predictionId,
    composer_model_id: input.composerModelId,
    model_label: snap.modelLabel,
    workflow: snap.workflowLabel,
    provider_used: snap.providerUsed,
    provider_attempted: input.providerAttempted ?? null,
    fallback_used: Boolean(input.fallbackUsed),
    fallback_reason: input.fallbackReason?.trim() || null,
    generation_status: input.status,
    resolution: input.resolution ?? null,
    aspect_ratio: input.aspectRatio ?? null,
    duration_sec: input.durationSec ?? null,
    generate_audio: input.generateAudio ?? null,
    speed_tier: input.speedTier ?? null,
    credits_charged: snap.creditsCharged,
    revenue_usd: snap.revenueUsd,
    provider_cost_usd: snap.providerCostUsd,
    gross_profit_usd: snap.grossProfitUsd,
    profit_margin_pct: snap.profitMarginPct,
    updated_at: new Date().toISOString()
  };

  if (predictionId) {
    const { data: existing } = await supabaseAdmin
      .from("generation_economics")
      .select("id")
      .eq("prediction_id", predictionId)
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin.from("generation_economics").update(row).eq("id", existing.id);
      return;
    }
  }

  const { error } = await supabaseAdmin.from("generation_economics").insert(row);
  if (error && process.env.NODE_ENV === "development") {
    console.error("[generation-economics] insert failed", error.message);
  }
}

/** Fire-and-forget economics log (never blocks the generation response). */
export function scheduleGenerationEconomics(input: GenerationEconomicsInput): void {
  void upsertGenerationEconomics(input).catch((err) => {
    console.error("[generation-economics] upsert error", err);
  });
}

export async function finalizeGenerationEconomicsStatus(args: {
  predictionId: string;
  status: "success" | "failed";
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("generation_economics")
    .update({
      generation_status: args.status,
      updated_at: new Date().toISOString()
    })
    .eq("prediction_id", args.predictionId.trim());

  if (error && process.env.NODE_ENV === "development") {
    console.error("[generation-economics] finalize failed", error.message);
  }
}
