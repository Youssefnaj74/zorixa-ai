import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DirectorRunMetadata } from "@/lib/ai-director/types";

export async function insertDirectorRun(args: {
  userId: string;
  metadata: DirectorRunMetadata;
}): Promise<number | null> {
  const m = args.metadata;
  const { data, error } = await supabaseAdmin
    .from("director_runs")
    .insert({
      user_id: args.userId,
      prompt: m.prompt.slice(0, 4000),
      style_requested: m.style_requested,
      style_resolved: m.style_resolved,
      routed_model: m.routed_model,
      route_action: m.route_action,
      success: m.success,
      prediction_id: m.prediction_id ?? null,
      output_url: m.output_url ?? null,
      credits_spent: m.credits_spent ?? 0
    })
    .select("id")
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[director-run] insert failed", error.message);
    }
    return null;
  }
  return data?.id ?? null;
}

export async function patchDirectorRunFeedback(args: {
  userId: string;
  runId: number;
  user_liked?: boolean;
  user_downloaded?: boolean;
}): Promise<boolean> {
  const patch: Record<string, boolean> = {};
  if (args.user_liked != null) patch.user_liked = args.user_liked;
  if (args.user_downloaded != null) patch.user_downloaded = args.user_downloaded;
  if (Object.keys(patch).length === 0) return false;

  const { error } = await supabaseAdmin
    .from("director_runs")
    .update(patch)
    .eq("id", args.runId)
    .eq("user_id", args.userId);

  if (error && process.env.NODE_ENV === "development") {
    console.warn("[director-run] patch failed", error.message);
  }
  return !error;
}
