import { atlasProviderForModel } from "@/lib/composer-model-label";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { lookupCreditsSpentForAtlasPrediction } from "@/lib/credits-charge";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PLACEHOLDER_INPUT =
  "https://placehold.co/640x640/0d0d12/a78bfa?text=Zorixa+Image+Studio";

function atlasImageTerminalSuccess(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "succeeded" || s === "completed" || s === "success";
}

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
  } else if (error && isMissingPromptColumn(error) && promptNorm) {
    await supabaseAdmin
      .from("generations")
      .update({ provider, composer_model_id: composerModelId })
      .eq("id", generationId);
  }
}

async function patchGenerationPrompt(generationId: number, prompt: string): Promise<void> {
  const promptNorm = normalizeStoredPrompt(prompt);
  if (!promptNorm) return;
  const { error } = await supabaseAdmin.from("generations").update({ prompt: promptNorm }).eq("id", generationId);
  if (error && !isMissingPromptColumn(error) && process.env.NODE_ENV === "development") {
    console.error("[atlas-image-generation-log] prompt patch failed", error.message);
  }
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
 * Persists a completed Atlas image studio output for dashboard history.
 * Skips duplicate rows when the same prediction id was already logged.
 */
export async function logAtlasImageGenerationIfNew(args: {
  userId: string;
  outputUrl: string;
  inputUrl?: string | null;
  predictionId?: string | null;
  /** Zorixa composer id (e.g. nano-banana-pro) for dashboard history. */
  composerModelId?: string | null;
  /** When set, only write if Atlas status is terminal success. Omit when output URL is already verified. */
  requireTerminalStatus?: string;
  /** User prompt — stored for Zorixa dashboard (Atlas Cloud may not display Arabic). */
  prompt?: string | null;
  /** Credits already deducted for this prediction. */
  creditsSpent?: number;
}): Promise<boolean> {
  if (
    args.requireTerminalStatus !== undefined &&
    !atlasImageTerminalSuccess(args.requireTerminalStatus)
  ) {
    return false;
  }

  const output_url = coerceToPublicHttpsUrl(args.outputUrl.trim());
  if (!output_url) return false;

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
      .eq("feature_type", "image")
      .maybeSingle();
    if (existing) {
      if (composer_model_id) {
        await patchGenerationModelMeta(existing.id, composer_model_id, prompt);
      } else if (prompt) {
        await patchGenerationPrompt(existing.id, prompt);
      }
      await patchGenerationCreditsSpent(existing.id, credits_spent);
      return true;
    }
  }

  const { data: existingByOutput } = await supabaseAdmin
    .from("generations")
    .select("id, composer_model_id, provider")
    .eq("user_id", args.userId)
    .eq("feature_type", "image")
    .eq("output_url", output_url)
    .maybeSingle();
  if (existingByOutput) {
    if (composer_model_id) {
      await patchGenerationModelMeta(existingByOutput.id, composer_model_id, prompt);
    } else if (prompt) {
      await patchGenerationPrompt(existingByOutput.id, prompt);
    }
    await patchGenerationCreditsSpent(existingByOutput.id, credits_spent);
    return true;
  }

  const inputRaw = args.inputUrl?.trim() ?? "";
  const coercedInput = inputRaw ? coerceToPublicHttpsUrl(inputRaw) : null;
  const inputFinal = coercedInput ?? PLACEHOLDER_INPUT;

  const baseRow = {
    user_id: args.userId,
    feature_type: "image" as const,
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

  let { error } = await supabaseAdmin.from("generations").insert(
    buildInsertRow({ model: true, promptField: true })
  );

  if (error && composer_model_id && isMissingComposerModelColumn(error)) {
    ({ error } = await supabaseAdmin.from("generations").insert(
      buildInsertRow({ model: false, promptField: true })
    ));
  }
  if (error && prompt && isMissingPromptColumn(error)) {
    ({ error } = await supabaseAdmin.from("generations").insert(
      buildInsertRow({ model: true, promptField: false })
    ));
  }

  if (error && process.env.NODE_ENV === "development") {
    console.error("[atlas-image-generation-log] insert failed", error.message);
  }

  return !error;
}
