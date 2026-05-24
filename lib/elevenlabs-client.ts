import { requireElevenLabsApiKey } from "@/lib/env";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

export const ELEVENLABS_TTS_MODEL_ID = "eleven_flash_v2_5";

export type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  preview_url?: string | null;
  labels?: Record<string, string>;
  /** premade | cloned | generated | professional — from ElevenLabs API */
  category?: string | null;
};

/** Categories usable on ElevenLabs free tier via API (library/pro voices need paid plan). */
const API_FREE_VOICE_CATEGORIES = new Set(["premade", "cloned"]);

/** Curated fallback when the voices API is unavailable. */
export const ELEVENLABS_DEFAULT_VOICES: ElevenLabsVoice[] = [
  { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", labels: { accent: "american", gender: "female" } },
  { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam", labels: { accent: "american", gender: "male" } },
  { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", labels: { accent: "american", gender: "female" } },
  { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni", labels: { accent: "american", gender: "male" } },
  { voice_id: "MF3mGyNOKKkPZ2YvizC0", name: "Elli", labels: { accent: "american", gender: "female" } },
  { voice_id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", labels: { accent: "american", gender: "male" } }
];

export const ELEVENLABS_TTS_MAX_CHARS = 5000;

function elevenLabsHeaders(apiKey: string): HeadersInit {
  return {
    "xi-api-key": apiKey,
    "Content-Type": "application/json"
  };
}

export async function fetchElevenLabsVoices(apiKey?: string): Promise<ElevenLabsVoice[]> {
  const key = apiKey ?? requireElevenLabsApiKey();
  const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: { "xi-api-key": key },
    cache: "no-store"
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      detail.trim().length > 0
        ? `ElevenLabs voices error (${res.status}): ${detail.slice(0, 200)}`
        : `ElevenLabs voices error (${res.status})`
    );
  }
  const data = (await res.json()) as {
    voices?: Array<ElevenLabsVoice & { category?: string }>;
  };
  const voices = Array.isArray(data.voices) ? data.voices : [];
  const mapped = voices
    .filter((v) => typeof v.voice_id === "string" && typeof v.name === "string")
    .map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      preview_url: v.preview_url ?? null,
      labels: v.labels,
      category: typeof v.category === "string" ? v.category : null
    }));

  const apiFree = mapped.filter((v) => {
    const cat = v.category?.toLowerCase();
    if (!cat) {
      return ELEVENLABS_DEFAULT_VOICES.some((d) => d.voice_id === v.voice_id);
    }
    return API_FREE_VOICE_CATEGORIES.has(cat);
  });

  return apiFree.length > 0 ? apiFree : ELEVENLABS_DEFAULT_VOICES;
}

export function formatElevenLabsTtsError(status: number, detail: string): string {
  try {
    const parsed = JSON.parse(detail) as {
      detail?: { code?: string; message?: string } | string;
    };
    const inner =
      typeof parsed.detail === "object" && parsed.detail !== null
        ? parsed.detail
        : null;
    if (inner?.code === "paid_plan_required") {
      return "This voice needs a paid ElevenLabs plan (Voice Library). Pick a default voice like Rachel or Adam, or upgrade your ElevenLabs subscription.";
    }
    if (typeof inner?.message === "string" && inner.message.trim()) {
      return inner.message.trim();
    }
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail.trim();
    }
  } catch {
    /* not JSON */
  }
  const trimmed = detail.trim();
  if (trimmed.length > 0) return trimmed.slice(0, 280);
  return `Speech generation failed (${status})`;
}

export type ElevenLabsTtsInput = {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
};

export async function synthesizeElevenLabsSpeech(
  input: ElevenLabsTtsInput,
  apiKey?: string
): Promise<ArrayBuffer> {
  const key = apiKey ?? requireElevenLabsApiKey();
  const text = input.text.trim();
  if (!text) throw new Error("Text is required");
  if (text.length > ELEVENLABS_TTS_MAX_CHARS) {
    throw new Error(`Text exceeds ${ELEVENLABS_TTS_MAX_CHARS} characters`);
  }

  const voiceId = input.voiceId.trim();
  if (!voiceId) throw new Error("Voice is required");

  const url = `${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: elevenLabsHeaders(key),
    body: JSON.stringify({
      text,
      model_id: input.modelId ?? ELEVENLABS_TTS_MODEL_ID,
      voice_settings: {
        stability: input.stability ?? 0.5,
        similarity_boost: input.similarityBoost ?? 0.75
      }
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(formatElevenLabsTtsError(res.status, detail));
  }

  return res.arrayBuffer();
}
