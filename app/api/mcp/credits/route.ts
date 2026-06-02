import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveZorixaActor, unauthorizedMcpResponse } from "@/lib/zorixa-mcp-auth";

export async function GET(request: Request) {
  const actor = await resolveZorixaActor(request);
  if (!actor) {
    return unauthorizedMcpResponse();
  }

  const userId = actor.userId;

  const { data, error } = await supabaseAdmin
    .from("users_profiles")
    .select("credits_balance, is_premium")
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    user_id: userId,
    credits_balance: data.credits_balance,
    is_premium: data.is_premium ?? false
  });
}
