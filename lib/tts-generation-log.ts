import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { supabaseAdmin } from "@/lib/supabase/admin";

export {
  isLikelyAudioOutputUrl,
  isTtsGenerationProvider,
  isTtsGenerationRow
} from "@/lib/tts-generation-shared";

const PLACEHOLDER_INPUT =
  "https://placehold.co/640x640/0d0d12/a78bfa?text=Zorixa+Speech";

function normalizeStoredPrompt(raw: string | null | undefined): string | null {
  const v = typeof raw === "string" ? raw.trim() : "";
  return v.length > 0 ? v.slice(0, 4000) : null;
}

/**
 * Persists a completed TTS output for dashboard history.
 * Uses feature_type "video" with provider "elevenlabs-tts" (no DB migration required).
 */
export async function logTtsGenerationIfNew(args: {
  userId: string;
  outputUrl: string;
  text?: string | null;
  voiceId?: string | null;
  creditsSpent?: number;
}): Promise<boolean> {
  const output_url = coerceToPublicHttpsUrl(args.outputUrl.trim());
  if (!output_url) return false;

  const { data: existingByOutput } = await supabaseAdmin
    .from("generations")
    .select("id")
    .eq("user_id", args.userId)
    .eq("feature_type", "video")
    .eq("output_url", output_url)
    .maybeSingle();
  if (existingByOutput) return true;

  const prompt = normalizeStoredPrompt(args.text);
  const voiceId =
    typeof args.voiceId === "string" && args.voiceId.trim().length > 0
      ? args.voiceId.trim()
      : null;

  const row: Record<string, unknown> = {
    user_id: args.userId,
    feature_type: "video",
    input_url: PLACEHOLDER_INPUT,
    output_url,
    provider: voiceId ? `elevenlabs-tts:${voiceId}` : "elevenlabs-tts",
    credits_spent: args.creditsSpent ?? 0,
    status: "completed"
  };
  if (prompt) row.prompt = prompt;

  const { error } = await supabaseAdmin.from("generations").insert(row);
  if (error && process.env.NODE_ENV === "development") {
    console.error("[tts-generation-log] insert failed", error.message);
  }
  return !error;
}
