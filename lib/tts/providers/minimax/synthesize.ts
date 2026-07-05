import { TTS_MAX_CHARS } from "@/lib/tts/constants";
import type { TtsSynthesizeInput, TtsSynthesizeResult } from "@/lib/tts/types";
import { assertMinimaxBaseResp, minimaxPostJson } from "@/lib/tts/providers/minimax/client";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";

type T2aResponse = {
  data?: {
    audio?: string;
    status?: number;
  } | null;
  extra_info?: {
    usage_characters?: number;
    audio_format?: string;
  };
  trace_id?: string;
  base_resp?: { status_code?: number; status_msg?: string };
};

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const normalized = hex.trim();
  if (normalized.length === 0) throw new Error("MiniMax returned empty audio");
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

/** Synchronous MiniMax TTS over HTTP (non-streaming). */
export async function synthesizeMinimaxSpeech(
  input: TtsSynthesizeInput,
  apiKey?: string
): Promise<TtsSynthesizeResult> {
  const text = input.text.trim();
  if (!text) throw new Error("Text is required");
  if (text.length > TTS_MAX_CHARS) {
    throw new Error(`Text exceeds ${TTS_MAX_CHARS} characters`);
  }

  const voiceId = input.voiceId.trim();
  if (!voiceId) throw new Error("Voice is required");

  const model = input.modelId?.trim() || MINIMAX_TTS_MODEL_ID;
  const speed =
    typeof input.speed === "number" && Number.isFinite(input.speed)
      ? Math.min(2, Math.max(0.5, input.speed))
      : 1;

  const { json, raw, status } = await minimaxPostJson<T2aResponse>(
    "/v1/t2a_v2",
    {
      model,
      text,
      stream: false,
      language_boost: "auto",
      output_format: "hex",
      voice_setting: {
        voice_id: voiceId,
        speed,
        vol: 1,
        pitch: 0
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1
      }
    },
    apiKey
  );

  assertMinimaxBaseResp(json.base_resp, status, raw);

  const audioHex = json.data?.audio?.trim();
  if (!audioHex) {
    throw new Error(json.base_resp?.status_msg?.trim() || "MiniMax returned no audio");
  }

  const usageCharacters = Math.max(
    json.extra_info?.usage_characters ?? 0,
    text.length
  );

  return {
    audio: hexToArrayBuffer(audioHex),
    usageCharacters,
    traceId: json.trace_id,
    contentType: "audio/mpeg"
  };
}
