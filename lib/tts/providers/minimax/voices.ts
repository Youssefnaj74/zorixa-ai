import { TTS_DEFAULT_VOICES } from "@/lib/tts/constants";
import type { TtsVoice } from "@/lib/tts/types";
import type { TtsVoiceCategory } from "@/lib/tts/providers/types";
import { assertMinimaxBaseResp, minimaxPostJson } from "@/lib/tts/providers/minimax/client";

type MinimaxSystemVoice = {
  voice_id?: string;
  voice_name?: string;
  description?: string[];
};

type MinimaxVoiceEntry = {
  voice_id?: string;
  description?: string[];
  created_time?: string;
};

type GetVoiceResponse = {
  system_voice?: MinimaxSystemVoice[];
  voice_cloning?: MinimaxVoiceEntry[];
  voice_generation?: MinimaxVoiceEntry[];
  base_resp?: { status_code?: number; status_msg?: string };
};

function inferAccent(voiceId: string): string | undefined {
  const prefix = voiceId.split("_")[0]?.trim();
  if (!prefix) return undefined;
  if (prefix.toLowerCase() === "english") return "english";
  return prefix.replace(/[()]/g, "").toLowerCase();
}

function mapSystemVoice(v: MinimaxSystemVoice): TtsVoice | null {
  const voice_id = v.voice_id?.trim();
  const name = v.voice_name?.trim() || voice_id;
  if (!voice_id || !name) return null;
  return {
    voice_id,
    name,
    labels: { accent: inferAccent(voice_id) ?? "multilingual" },
    category: "system"
  };
}

function mapAccountVoice(v: MinimaxVoiceEntry, category: "cloned" | "designed"): TtsVoice | null {
  const voice_id = v.voice_id?.trim();
  if (!voice_id) return null;
  const desc = v.description?.find((line) => line.trim().length > 0)?.trim();
  return {
    voice_id,
    name: desc || voice_id,
    labels: { accent: inferAccent(voice_id) ?? "custom" },
    category
  };
}

function sortVoicesForSelector(voices: TtsVoice[]): TtsVoice[] {
  return [...voices].sort((a, b) => {
    const aEnglish = a.labels?.accent === "english" ? 0 : 1;
    const bEnglish = b.labels?.accent === "english" ? 0 : 1;
    if (aEnglish !== bEnglish) return aEnglish - bEnglish;
    return a.name.localeCompare(b.name);
  });
}

function categoriesToVoiceType(categories: TtsVoiceCategory[]): "system" | "voice_cloning" | "voice_generation" | "all" {
  const set = new Set(categories);
  if (set.size === 1 && set.has("system")) return "system";
  if (set.size === 1 && set.has("cloned")) return "voice_cloning";
  if (set.size === 1 && set.has("designed")) return "voice_generation";
  return "all";
}

/** Lists MiniMax system voices plus account clone/design voices when requested. */
export async function fetchMinimaxVoices(
  apiKey?: string,
  categories: TtsVoiceCategory[] = ["system"]
): Promise<TtsVoice[]> {
  const { json } = await minimaxPostJson<GetVoiceResponse>(
    "/v1/get_voice",
    { voice_type: categoriesToVoiceType(categories) },
    apiKey
  );

  assertMinimaxBaseResp(json.base_resp, 200);

  const mapped: TtsVoice[] = [];
  for (const v of json.system_voice ?? []) {
    const voice = mapSystemVoice(v);
    if (voice) mapped.push(voice);
  }
  for (const v of json.voice_cloning ?? []) {
    const voice = mapAccountVoice(v, "cloned");
    if (voice) mapped.push(voice);
  }
  for (const v of json.voice_generation ?? []) {
    const voice = mapAccountVoice(v, "designed");
    if (voice) mapped.push(voice);
  }

  const filtered =
    categories.length === 1
      ? mapped.filter((v) => v.category === categories[0])
      : mapped;

  const sorted = sortVoicesForSelector(filtered);
  if (sorted.length > 0) return sorted;

  const englishDefaults = TTS_DEFAULT_VOICES.filter((v) => v.labels?.accent === "english");
  return englishDefaults.length > 0 ? englishDefaults : TTS_DEFAULT_VOICES;
}
