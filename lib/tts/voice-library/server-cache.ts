import type { TtsVoice } from "@/lib/tts/types";
import type { TtsVoiceCategory } from "@/lib/tts/providers/types";
import { TTS_DEFAULT_VOICES } from "@/lib/tts/constants";
import { fetchMinimaxVoiceLibrary } from "@/lib/tts/providers/minimax/voice-library";
import { enrichVoiceMetadata, sortVoicesForLibrary } from "@/lib/tts/voice-library/metadata";
import { TTS_VOICE_LIBRARY_CATEGORIES } from "@/lib/tts/voice-library/categories";
import { buildVoiceLibraryFacets } from "@/lib/tts/voice-library/filters";

const VOICE_LIST_CACHE_TTL_MS = 15 * 60 * 1000;

type CachedVoiceLibrary = {
  voices: TtsVoice[];
  facets: ReturnType<typeof buildVoiceLibraryFacets>;
  fetchedAt: number;
};

let voiceListCache: CachedVoiceLibrary | null = null;

function enrichAll(voices: TtsVoice[]): TtsVoice[] {
  return sortVoicesForLibrary(voices.map((v) => enrichVoiceMetadata(v)));
}

export function clearTtsVoiceListCache(): void {
  voiceListCache = null;
}

export async function getCachedTtsVoiceLibrary(options: {
  apiKey?: string;
  forceRefresh?: boolean;
}): Promise<{
  voices: TtsVoice[];
  categories: TtsVoiceCategory[];
  facets: ReturnType<typeof buildVoiceLibraryFacets>;
  cached: boolean;
}> {
  const now = Date.now();
  if (
    !options.forceRefresh &&
    voiceListCache &&
    now - voiceListCache.fetchedAt < VOICE_LIST_CACHE_TTL_MS
  ) {
    return {
      voices: voiceListCache.voices,
      categories: TTS_VOICE_LIBRARY_CATEGORIES,
      facets: voiceListCache.facets,
      cached: true
    };
  }

  if (!options.apiKey) {
    const voices = enrichAll(TTS_DEFAULT_VOICES);
    const facets = buildVoiceLibraryFacets(voices);
    return { voices, categories: ["system"], facets, cached: false };
  }

  const { voices: raw } = await fetchMinimaxVoiceLibrary({
    apiKey: options.apiKey,
    categories: TTS_VOICE_LIBRARY_CATEGORIES
  });
  const voices = enrichAll(raw);
  const facets = buildVoiceLibraryFacets(voices);

  voiceListCache = { voices, facets, fetchedAt: now };
  return { voices, categories: TTS_VOICE_LIBRARY_CATEGORIES, facets, cached: false };
}
