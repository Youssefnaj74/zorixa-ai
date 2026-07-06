import type { TtsVoiceCategory } from "@/lib/tts/providers/types";
import { TTS_VOICE_LIBRARY_CATEGORIES } from "@/lib/tts/voice-library/categories";
import { fetchMinimaxVoices } from "@/lib/tts/providers/minimax/voices";

export type MinimaxVoiceLibraryOptions = {
  apiKey?: string;
  categories?: TtsVoiceCategory[];
};

/**
 * Voice Library facade — unified listing for system, cloned, and designed voices.
 * Used by `/api/tts/voices` today; future UI tabs can pass explicit categories.
 */
export async function fetchMinimaxVoiceLibrary(
  options: MinimaxVoiceLibraryOptions = {}
): Promise<{
  voices: Awaited<ReturnType<typeof fetchMinimaxVoices>>;
  categories: TtsVoiceCategory[];
}> {
  const categories = options.categories ?? TTS_VOICE_LIBRARY_CATEGORIES;
  const voices = await fetchMinimaxVoices(options.apiKey, categories);
  return { voices, categories };
}
