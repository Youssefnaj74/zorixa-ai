import { supabaseAdmin } from "@/lib/supabase/admin";
import type { UserClonedVoice } from "@/lib/supabase/types";

function mapRow(row: Record<string, unknown>): UserClonedVoice {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    voice_id: String(row.voice_id),
    display_name: String(row.display_name),
    source_audio_url: row.source_audio_url ? String(row.source_audio_url) : null,
    demo_audio_url: row.demo_audio_url ? String(row.demo_audio_url) : null,
    provider: String(row.provider ?? "minimax"),
    model_id: row.model_id ? String(row.model_id) : null,
    status: (row.status as UserClonedVoice["status"]) ?? "active",
    activated_at: row.activated_at ? String(row.activated_at) : null,
    created_at: String(row.created_at)
  };
}

export async function listUserClonedVoices(userId: string): Promise<UserClonedVoice[]> {
  const { data, error } = await supabaseAdmin
    .from("user_cloned_voices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("user_cloned_voices")) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getUserClonedVoice(
  userId: string,
  voiceId: string
): Promise<UserClonedVoice | null> {
  const { data, error } = await supabaseAdmin
    .from("user_cloned_voices")
    .select("*")
    .eq("user_id", userId)
    .eq("voice_id", voiceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function insertUserClonedVoice(input: {
  userId: string;
  voiceId: string;
  displayName: string;
  sourceAudioUrl?: string | null;
  demoAudioUrl?: string | null;
  modelId?: string | null;
  status?: UserClonedVoice["status"];
  activatedAt?: string | null;
}): Promise<UserClonedVoice> {
  const { data, error } = await supabaseAdmin
    .from("user_cloned_voices")
    .insert({
      user_id: input.userId,
      voice_id: input.voiceId,
      display_name: input.displayName,
      source_audio_url: input.sourceAudioUrl ?? null,
      demo_audio_url: input.demoAudioUrl ?? null,
      model_id: input.modelId ?? null,
      status: input.status ?? "active",
      activated_at: input.activatedAt ?? new Date().toISOString(),
      provider: "minimax"
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as Record<string, unknown>);
}

export async function renameUserClonedVoice(
  userId: string,
  voiceId: string,
  displayName: string
): Promise<UserClonedVoice | null> {
  const { data, error } = await supabaseAdmin
    .from("user_cloned_voices")
    .update({ display_name: displayName })
    .eq("user_id", userId)
    .eq("voice_id", voiceId)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function deleteUserClonedVoice(userId: string, voiceId: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("user_cloned_voices")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("voice_id", voiceId);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}
