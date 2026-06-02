import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  countActiveUserApiKeys,
  generateUserApiKey,
  hashUserApiKey,
  keyPrefixForDisplay,
  MAX_USER_API_KEYS
} from "@/lib/user-api-keys";

export async function GET() {
  const rl = rateLimit({ key: "api-keys:list", limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("user_api_keys")
    .select("id, key_prefix, label, created_at, last_used_at, revoked_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    keys: data ?? [],
    max_keys: MAX_USER_API_KEYS
  });
}

export async function POST(request: Request) {
  const rl = rateLimit({ key: "api-keys:create", limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activeCount = await countActiveUserApiKeys(user.id);
  if (activeCount >= MAX_USER_API_KEYS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_USER_API_KEYS} active API keys. Revoke one first.` },
      { status: 400 }
    );
  }

  let label: string | null = null;
  try {
    const body = (await request.json()) as { label?: string };
    if (typeof body.label === "string") {
      const trimmed = body.label.trim().slice(0, 64);
      label = trimmed.length > 0 ? trimmed : null;
    }
  } catch {
    /* empty body ok */
  }

  const rawKey = generateUserApiKey();
  const { data, error } = await supabaseAdmin
    .from("user_api_keys")
    .insert({
      user_id: user.id,
      key_hash: hashUserApiKey(rawKey),
      key_prefix: keyPrefixForDisplay(rawKey),
      label
    })
    .select("id, key_prefix, label, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    key: rawKey,
    id: data.id,
    key_prefix: data.key_prefix,
    label: data.label,
    created_at: data.created_at,
    message: "Copy this key now — it will not be shown again."
  });
}
