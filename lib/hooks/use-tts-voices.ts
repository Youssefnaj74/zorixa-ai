import useSWR from "swr";

import type { TtsVoice } from "@/lib/tts/types";
import type { VoiceLibraryFacet } from "@/lib/tts/voice-library/filters";
import { TTS_DEFAULT_VOICES } from "@/lib/tts/constants";
import { enrichVoiceMetadata, sortVoicesForLibrary } from "@/lib/tts/voice-library/metadata";
import { buildVoiceLibraryFacets } from "@/lib/tts/voice-library/filters";

export type TtsVoicesApiResponse = {
  voices?: TtsVoice[];
  facets?: {
    languages: VoiceLibraryFacet[];
    genders: VoiceLibraryFacet[];
    styles: VoiceLibraryFacet[];
  };
  warning?: string;
  cached?: boolean;
  provider?: string;
};

const FALLBACK_VOICES = sortVoicesForLibrary(TTS_DEFAULT_VOICES.map((v) => enrichVoiceMetadata(v)));
const FALLBACK_FACETS = buildVoiceLibraryFacets(FALLBACK_VOICES);

async function fetchTtsVoices(url: string): Promise<Required<Pick<TtsVoicesApiResponse, "voices" | "facets">> & TtsVoicesApiResponse> {
  const res = await fetch(url);
  const data = (await res.json()) as TtsVoicesApiResponse;
  const voices =
    Array.isArray(data.voices) && data.voices.length > 0 ? data.voices : FALLBACK_VOICES;
  const facets = data.facets ?? buildVoiceLibraryFacets(voices);
  return { ...data, voices, facets };
}

export function useTtsVoices() {
  const { data, error, isLoading, mutate } = useSWR("/api/tts/voices", fetchTtsVoices, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000
  });

  return {
    voices: data?.voices ?? FALLBACK_VOICES,
    facets: data?.facets ?? FALLBACK_FACETS,
    warning: data?.warning,
    cached: data?.cached,
    provider: data?.provider,
    isLoading,
    error,
    refresh: mutate
  };
}
