import { requireMinimaxApiKey } from "@/lib/env";
import { formatTtsHttpError } from "@/lib/tts/errors";

export const MINIMAX_API_BASE = "https://api.minimax.io";

export type MinimaxBaseResp = {
  status_code?: number;
  status_msg?: string;
};

export function minimaxAuthHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
}

export function resolveMinimaxApiKey(apiKey?: string): string {
  return apiKey?.trim() || requireMinimaxApiKey();
}

export function assertMinimaxBaseResp(
  baseResp: MinimaxBaseResp | undefined,
  httpStatus: number,
  rawDetail?: string
): void {
  if (baseResp?.status_code === 0 || baseResp?.status_code === undefined) return;
  const msg =
    baseResp.status_msg?.trim() ||
    (rawDetail ? formatTtsHttpError("MiniMax", httpStatus, rawDetail) : `MiniMax API error (${httpStatus})`);
  throw new Error(msg);
}

export async function minimaxPostJson<T>(
  path: string,
  body: unknown,
  apiKey?: string
): Promise<{ json: T; raw: string; status: number }> {
  const key = resolveMinimaxApiKey(apiKey);
  const res = await fetch(`${MINIMAX_API_BASE}${path}`, {
    method: "POST",
    headers: minimaxAuthHeaders(key),
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const raw = await res.text().catch(() => "");
  let json = {} as T;
  if (raw.trim()) {
    try {
      json = JSON.parse(raw) as T;
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

  return { json, raw, status: res.status };
}
