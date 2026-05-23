import { atlasProviderForModel } from "@/lib/composer-model-label";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
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
}): Promise<boolean> {
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
      return true;
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
    return true;
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
    credits_spent: 0,
    status: "completed" as const
  };

  let row: Record<string, unknown> = composer_model_id
    ? { ...baseRow, composer_model_id }
    : { ...baseRow };
  if (prompt) row = { ...row, prompt };

  let { error } = await supabaseAdmin.from("generations").insert(row);

  if (error && composer_model_id && isMissingComposerModelColumn(error)) {
    ({ error } = await supabaseAdmin.from("generations").insert(prompt ? { ...baseRow, prompt } : baseRow));
  }
  if (error && prompt && isMissingPromptColumn(error)) {
    ({ error } = await supabaseAdmin.from("generations").insert(
      composer_model_id ? { ...baseRow, composer_model_id } : baseRow
    ));
  }

  if (error && process.env.NODE_ENV === "development") {
    console.error("[atlas-video-generation-log] insert failed", error.message);
  }

  return !error;
}
