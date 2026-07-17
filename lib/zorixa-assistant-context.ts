/**
 * ZorixaAI Assistant grounding context.
 * The LLM never queries Supabase or catalogs — the backend fetches everything first.
 */

import {
  buildStaticAssistantGrounding,
  normalizeClientContext
} from "@/lib/zorixa-assistant-grounding";
import type {
  ZorixaAssistantClientContext,
  ZorixaAssistantGrounding,
  ZorixaAssistantUserSnapshot
} from "@/lib/zorixa-assistant-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type {
  ZorixaAssistantClientContext,
  ZorixaAssistantGrounding,
  ZorixaAssistantUserSnapshot
} from "@/lib/zorixa-assistant-types";

export { buildStaticAssistantGrounding, normalizeClientContext };

function resolvePlanLabel(isPremium: boolean, credits: number): string {
  if (isPremium) return "Premium";
  if (credits > 0) return "Credits";
  return "Free";
}

export async function loadAssistantUserSnapshot(
  userId: string
): Promise<ZorixaAssistantUserSnapshot | null> {
  const { data, error } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance, is_premium")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const credits = typeof data.credits_balance === "number" ? data.credits_balance : 0;
  const isPremium = Boolean(data.is_premium);
  return {
    credits,
    isPremium,
    plan: resolvePlanLabel(isPremium, credits)
  };
}

export async function buildAssistantGrounding(input: {
  userId: string | null;
  client?: ZorixaAssistantClientContext | null;
}): Promise<ZorixaAssistantGrounding> {
  const user = input.userId ? await loadAssistantUserSnapshot(input.userId) : null;
  return buildStaticAssistantGrounding({
    user,
    client: input.client
  });
}
