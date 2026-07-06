/**
 * Compare MiniMax get_voice API counts with Zorixa fetchMinimaxVoices mapping.
 * Usage: node --env-file=.env.local --import tsx scripts/audit-minimax-voices.mts
 */
import { fetchMinimaxVoices } from "../lib/tts/providers/minimax/voices.ts";
import { minimaxPostJson } from "../lib/tts/providers/minimax/client.ts";

type GetVoiceResponse = {
  system_voice?: { voice_id?: string; voice_name?: string }[];
  voice_cloning?: { voice_id?: string }[];
  voice_generation?: { voice_id?: string }[];
  base_resp?: { status_code?: number; status_msg?: string };
};

const apiKey = process.env.MINIMAX_API_KEY?.trim();
if (!apiKey) {
  console.error("MINIMAX_API_KEY missing — set in .env.local");
  process.exit(1);
}

const { json } = await minimaxPostJson<GetVoiceResponse>(
  "/v1/get_voice",
  { voice_type: "all" },
  apiKey
);

const apiSystem = (json.system_voice ?? []).map((v) => v.voice_id?.trim()).filter(Boolean) as string[];
const apiCloned = (json.voice_cloning ?? []).map((v) => v.voice_id?.trim()).filter(Boolean) as string[];
const apiDesigned = (json.voice_generation ?? []).map((v) => v.voice_id?.trim()).filter(Boolean) as string[];

const zorixaVoices = await fetchMinimaxVoices(apiKey, ["system", "cloned", "designed"]);
const zorixaIds = new Set(zorixaVoices.map((v) => v.voice_id));

const apiAll = [...apiSystem, ...apiCloned, ...apiDesigned];
const missing = apiAll.filter((id) => !zorixaIds.has(id));
const extra = zorixaVoices.filter((v) => !apiAll.includes(v.voice_id)).map((v) => v.voice_id);

const byCategory = {
  system: zorixaVoices.filter((v) => v.category === "system").length,
  cloned: zorixaVoices.filter((v) => v.category === "cloned").length,
  designed: zorixaVoices.filter((v) => v.category === "designed").length
};

console.log(
  JSON.stringify(
    {
      minimax_api: {
        system: apiSystem.length,
        cloned: apiCloned.length,
        designed: apiDesigned.length,
        total: apiAll.length,
        status: json.base_resp?.status_msg ?? "ok"
      },
      zorixa_mapped: {
        total: zorixaVoices.length,
        ...byCategory
      },
      missing_count: missing.length,
      missing_voice_ids: missing.slice(0, 20),
      unexpected_extra_count: extra.length,
      unexpected_extra_ids: extra
    },
    null,
    2
  )
);
