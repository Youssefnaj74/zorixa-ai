import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PLACEHOLDER_INPUT =
  "https://placehold.co/640x640/0d0d12/a78bfa?text=Zorixa+Image+Studio";

function atlasImageTerminalSuccess(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "succeeded" || s === "completed";
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
  /** When logging from a poll response, only write on terminal success. */
  requireTerminalStatus?: string;
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

  if (prediction_id) {
    const { data: existing } = await supabaseAdmin
      .from("generations")
      .select("id")
      .eq("user_id", args.userId)
      .eq("provider_prediction_id", prediction_id)
      .eq("feature_type", "image")
      .maybeSingle();
    if (existing) return true;
  }

  const inputRaw = args.inputUrl?.trim() ?? "";
  const coercedInput = inputRaw ? coerceToPublicHttpsUrl(inputRaw) : null;
  const inputFinal = coercedInput ?? PLACEHOLDER_INPUT;

  const { error } = await supabaseAdmin.from("generations").insert({
    user_id: args.userId,
    feature_type: "image",
    input_url: inputFinal,
    output_url,
    provider: "atlas",
    provider_prediction_id: prediction_id,
    credits_spent: 0,
    status: "completed"
  });

  return !error;
}
