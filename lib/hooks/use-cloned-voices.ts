import useSWR from "swr";

import type { UserClonedVoice } from "@/lib/supabase/types";

type ClonedVoicesResponse = {
  voices?: UserClonedVoice[];
  error?: string;
};

async function fetchClonedVoices(url: string): Promise<UserClonedVoice[]> {
  const res = await fetch(url, { credentials: "include" });
  const data = (await res.json()) as ClonedVoicesResponse;
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load cloned voices");
  }
  return Array.isArray(data.voices) ? data.voices : [];
}

export function useClonedVoices() {
  const { data, error, isLoading, mutate } = useSWR("/api/tts/cloned-voices", fetchClonedVoices, {
    revalidateOnFocus: true
  });

  return {
    voices: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate
  };
}
