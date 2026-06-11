import { supabaseAdmin } from "@/lib/supabase/admin";

import type { ModerationCategory, ModerationWorkflow } from "./constants";
import { normalizeModerationText } from "./moderate-prompt";

export type ModerationBlockLogInput = {
  userId: string | null;
  workflow: ModerationWorkflow;
  route: string;
  category: ModerationCategory;
  matchedPattern: string;
  promptPreview: string;
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

function previewPrompt(text: string, maxLen = 240): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen)}…`;
}

/** Persist blocked generation attempts for trust & safety review. */
export async function logModerationBlock(input: ModerationBlockLogInput): Promise<void> {
  const row = {
    user_id: input.userId,
    workflow: input.workflow,
    route: input.route,
    category: input.category,
    matched_pattern: input.matchedPattern,
    prompt_preview: previewPrompt(input.promptPreview),
    prompt_normalized_preview: previewPrompt(normalizeModerationText(input.promptPreview)),
    ip_address: input.ip ?? null,
    metadata: input.metadata ?? {}
  };

  console.warn("[content-moderation] blocked", {
    workflow: row.workflow,
    route: row.route,
    category: row.category,
    user_id: row.user_id
  });

  const { error } = await supabaseAdmin.from("moderation_blocks").insert(row);
  if (error) {
    console.error("[content-moderation] log insert failed", error.message);
  }
}
