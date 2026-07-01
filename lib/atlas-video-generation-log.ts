import { atlasProviderForModel } from "@/lib/composer-model-label";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { lookupCreditsSpentForAtlasPrediction } from "@/lib/credits-charge";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PLACEHOLDER_INPUT =
  "https://placehold.co/640x360/0d0d12/a78bfa?text=Zorixa+Video+Studio";

function isMissingComposerModelColumn(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    msg.includes("composer_model_id")
  );
}

function isMissingPromptColumn(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return error.code === "42703" || error.code === "PGRST204" || msg.includes("prompt");
}

function normalizeStoredPrompt(raw: string | null | undefined): string | null {
  const v = typeof raw === "string" ? raw.trim() : "";
  return v.length > 0 ? v.slice(0, 4000) : null;
}

async function patchGenerationModelMeta(
  generationId: number,
  composerModelId: string,
  prompt?: string | null
): Promise<void> {
  const provider = atlasProviderForModel(composerModelId);
  const promptNorm = normalizeStoredPrompt(prompt);
  const withPrompt = promptNorm ? { provider, composer_model_id: composerModelId, prompt: promptNorm } : { provider, composer_model_id: composerModelId };
  const { error } = await supabaseAdmin.from("generations").update(withPrompt).eq("id", generationId);
  if (error && isMissingComposerModelColumn(error)) {
    await supabaseAdmin.from("generations").update({ provider }).eq("id", generationId);
  }
}

async function patchGenerationPrompt(generationId: number, prompt: string): Promise<void> {
  const promptNorm = normalizeStoredPrompt(prompt);
  if (!promptNorm) return;
  await supabaseAdmin.from("generations").update({ prompt: promptNorm }).eq("id", generationId);
}

async function patchGenerationCreditsSpent(
  generationId: number,
  creditsSpent: number | undefined
): Promise<void> {
  if (creditsSpent == null || creditsSpent < 0) return;
  const { data: row } = await supabaseAdmin
    .from("generations")
    .select("credits_spent")
    .eq("id", generationId)
    .maybeSingle();
  const current = row?.credits_spent ?? 0;
  if (current >= creditsSpent) return;
  await supabaseAdmin.from("generations").update({ credits_spent: creditsSpent }).eq("id", generationId);
}

async function resolveCreditsSpentForLog(args: {
  userId: string;
  predictionId: string | null;
  creditsSpent?: number;
}): Promise<number> {
  if (args.creditsSpent != null && args.creditsSpent > 0) return args.creditsSpent;
  if (args.predictionId) {
    const fromTx = await lookupCreditsSpentForAtlasPrediction(args.userId, args.predictionId);
    if (fromTx > 0) return fromTx;
  }
  return Math.max(0, args.creditsSpent ?? 0);
}

/**
 * Persists a completed Atlas video studio output for dashboard history.
 * Skips duplicate rows for the same prediction id or output URL.
 */
export async function logAtlasVideoGenerationIfNew(args: {
  userId: string;
  outputUrl: string;
  inputUrl?: string | null;
  predictionId?: string | null;
  composerModelId?: string | null;
  prompt?: string | null;
  creditsSpent?: number;
}): Promise<{ ok: boolean; generationId: number | null }> {
  const output_url = coerceToPublicHttpsUrl(args.outputUrl.trim());
  if (!output_url) return { ok: false, generationId: null };

  const prediction_id =
    typeof args.predictionId === "string" && args.predictionId.trim().length > 0
      ? args.predictionId.trim()
      : null;

  const composer_model_id =
    typeof args.composerModelId === "string" && args.composerModelId.trim().length > 0
      ? args.composerModelId.trim()
      : null;

  const prompt = normalizeStoredPrompt(args.prompt);

  const credits_spent = await resolveCreditsSpentForLog({
    userId: args.userId,
    predictionId: prediction_id,
    creditsSpent: args.creditsSpent
  });

  if (prediction_id) {
    const { data: existing } = await supabaseAdmin
      .from("generations")
      .select("id, composer_model_id, provider")
      .eq("user_id", args.userId)
      .eq("provider_prediction_id", prediction_id)
      .eq("feature_type", "video")
      .maybeSingle();
    if (existing) {
      if (composer_model_id) {
        await patchGenerationModelMeta(existing.id, composer_model_id, prompt);
      } else if (prompt) {
        await patchGenerationPrompt(existing.id, prompt);
      }
      await patchGenerationCreditsSpent(existing.id, credits_spent);
      return { ok: true, generationId: existing.id };
    }
  }

  const { data: existingByOutput } = await supabaseAdmin
    .from("generations")
    .select("id, composer_model_id, provider")
    .eq("user_id", args.userId)
    .eq("feature_type", "video")
    .eq("output_url", output_url)
    .maybeSingle();
  if (existingByOutput) {
    if (composer_model_id) {
      await patchGenerationModelMeta(existingByOutput.id, composer_model_id, prompt);
    } else if (prompt) {
      await patchGenerationPrompt(existingByOutput.id, prompt);
    }
    await patchGenerationCreditsSpent(existingByOutput.id, credits_spent);
    return { ok: true, generationId: existingByOutput.id };
  }

  const inputRaw = args.inputUrl?.trim() ?? "";
  const coercedInput = inputRaw ? coerceToPublicHttpsUrl(inputRaw) : null;
  const inputFinal = coercedInput ?? PLACEHOLDER_INPUT;

  const baseRow = {
    user_id: args.userId,
    feature_type: "video" as const,
    input_url: inputFinal,
    output_url,
    provider: atlasProviderForModel(composer_model_id),
    provider_prediction_id: prediction_id,
    credits_spent,
    status: "completed" as const
  };

  const buildInsertRow = (opts: { model?: boolean; promptField?: boolean }): Record<string, unknown> => {
    const row: Record<string, unknown> = { ...baseRow };
    if (opts.model && composer_model_id) row.composer_model_id = composer_model_id;
    if (opts.promptField && prompt) row.prompt = prompt;
    return row;
  };

  let { data: inserted, error } = await supabaseAdmin
    .from("generations")
    .insert(buildInsertRow({ model: true, promptField: true }))
    .select("id")
    .maybeSingle();

  if (error && composer_model_id && isMissingComposerModelColumn(error)) {
    ({ data: inserted, error } = await supabaseAdmin
      .from("generations")
      .insert(buildInsertRow({ model: false, promptField: true }))
      .select("id")
      .maybeSingle());
  }
  if (error && prompt && isMissingPromptColumn(error)) {
    ({ data: inserted, error } = await supabaseAdmin
      .from("generations")
      .insert(buildInsertRow({ model: true, promptField: false }))
      .select("id")
      .maybeSingle());
  }

  if (error && process.env.NODE_ENV === "development") {
    console.error("[atlas-video-generation-log] insert failed", error.message);
  }

  return { ok: !error, generationId: inserted?.id ?? null };
}
