import { MINIMAX_API_BASE, assertMinimaxBaseResp, resolveMinimaxApiKey } from "@/lib/tts/providers/minimax/client";
import { formatTtsHttpError } from "@/lib/tts/errors";

type UploadFileResponse = {
  file?: {
    file_id?: number;
    filename?: string;
    purpose?: string;
  };
  base_resp?: { status_code?: number; status_msg?: string };
};

export type MinimaxUploadPurpose = "voice_clone" | "prompt_audio";

/** Upload audio to MiniMax for voice cloning (multipart). */
export async function minimaxUploadFile(
  file: Blob,
  filename: string,
  purpose: MinimaxUploadPurpose,
  apiKey?: string
): Promise<{ fileId: number }> {
  const key = resolveMinimaxApiKey(apiKey);
  const form = new FormData();
  form.append("purpose", purpose);
  form.append("file", file, filename);

  const res = await fetch(`${MINIMAX_API_BASE}/v1/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`
    },
    body: form,
    cache: "no-store"
  });

  const raw = await res.text().catch(() => "");
  let json = {} as UploadFileResponse;
  if (raw.trim()) {
    try {
      json = JSON.parse(raw) as UploadFileResponse;
    } catch {
      if (!res.ok) {
        throw new Error(formatTtsHttpError("MiniMax", res.status, raw));
      }
      throw new Error("MiniMax returned invalid JSON");
    }
  }

  if (!res.ok) {
    throw new Error(formatTtsHttpError("MiniMax", res.status, raw));
  }

  assertMinimaxBaseResp(json.base_resp, res.status, raw);

  const fileId = json.file?.file_id;
  if (fileId == null || !Number.isFinite(fileId)) {
    throw new Error("MiniMax upload returned no file_id");
  }

  return { fileId };
}
