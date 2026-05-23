import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  resolveZorixaMcpUserId,
  isZorixaMcpRequest,
  unauthorizedMcpResponse
} from "@/lib/zorixa-mcp-auth";

export async function GET(request: Request) {
  if (!isZorixaMcpRequest(request)) {
    return unauthorizedMcpResponse();
  }

  const userId = await resolveZorixaMcpUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Missing or invalid X-Zorixa-User-Id header." },
      { status: 400 }
    );
  }

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
