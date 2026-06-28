import { env } from "@/lib/env";

/** Prefix for BytePlus task IDs returned to the client (GET poll routes by prefix). */
export const BYTEPLUS_PREDICTION_PREFIX = "byteplus:";

const REGION_BASE_URL: Record<string, string> = {
  "ap-southeast-1": "https://ark.ap-southeast.bytepluses.com/api/v3",
  "eu-west-1": "https://ark.eu-west.bytepluses.com/api/v3"
};

export class BytePlusApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "BytePlusApiError";
  }
}

export function bytePlusApiBaseUrl(): string {
  const region = env.bytePlusRegion.trim() || "ap-southeast-1";
  return REGION_BASE_URL[region] ?? REGION_BASE_URL["ap-southeast-1"];
}

export function encodeBytePlusPredictionId(taskId: string): string {
  return `${BYTEPLUS_PREDICTION_PREFIX}${taskId}`;
}

export function decodeBytePlusPredictionId(predictionId: string): string | null {
  const trimmed = predictionId.trim();
  if (!trimmed.startsWith(BYTEPLUS_PREDICTION_PREFIX)) return null;
  const taskId = trimmed.slice(BYTEPLUS_PREDICTION_PREFIX.length).trim();
  return taskId.length > 0 ? taskId : null;
}

export function isBytePlusPredictionId(predictionId: string): boolean {
  return decodeBytePlusPredictionId(predictionId) !== null;
}

function getBytePlusApiKey(): string {
  const key = env.bytePlusApiKey;
  if (!key) {
    throw new BytePlusApiError("Missing BYTEPLUS_API_KEY", 500);
  }
  return key;
}

export type BytePlusContentItem =
  | { type: "text"; text: string }
  | {
      type: "image_url";
      image_url: { url: string };
      role?: "first_frame" | "last_frame" | "reference_image";
    }
  | {
      type: "video_url";
      video_url: { url: string };
      role?: "reference_video";
    }
  | {
      type: "audio_url";
      audio_url: { url: string };
      role?: "reference_audio";
    };

export type BytePlusCreateTaskBody = {
  model: string;
  content: BytePlusContentItem[];
  ratio?: string;
  resolution?: string;
  duration?: number;
  generate_audio?: boolean;
  return_last_frame?: boolean;
  watermark?: boolean;
};

type BytePlusTaskEnvelope = {
  id?: string;
  status?: string;
  content?: {
    video_url?: string;
    last_frame_url?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
};

export type BytePlusTaskPoll = {
  status: string;
  outputUrl: string | null;
  error: string | null;
  taskId: string;
};

function bytePlusErrorFromEnvelope(json: BytePlusTaskEnvelope): string | null {
  if (typeof json.error?.message === "string" && json.error.message.trim()) {
    const code = json.error.code?.trim();
    return code ? `${code}: ${json.error.message.trim()}` : json.error.message.trim();
  }
  if (typeof json.message === "string" && json.message.trim()) {
    return json.message.trim();
  }
  return null;
}

function normalizeBytePlusTerminalStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === "succeeded") return "succeeded";
  if (s === "failed" || s === "expired" || s === "cancelled") return "failed";
  return status;
}

/**
 * POST `/contents/generations/tasks` — create a Seedance video generation task.
 * @see https://docs.byteplus.com/en/docs/ModelArk/Video_Generation_API
 */
export async function createBytePlusVideoTask(
  body: BytePlusCreateTaskBody
): Promise<{ taskId: string; status: string; outputUrl: string | null }> {
  const apiKey = getBytePlusApiKey();
  const res = await fetch(`${bytePlusApiBaseUrl()}/contents/generations/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const json = (await res.json()) as BytePlusTaskEnvelope;
  if (!res.ok) {
    const msg = bytePlusErrorFromEnvelope(json) ?? `BytePlus create task failed (${res.status})`;
    throw new BytePlusApiError(msg, res.status >= 400 ? res.status : 502);
  }

  const taskId = json.id?.trim();
  if (!taskId) {
    throw new BytePlusApiError("BytePlus did not return a task id", 502);
  }

  const status = json.status ?? "queued";
  const outputUrl =
    typeof json.content?.video_url === "string" && json.content.video_url.trim()
      ? json.content.video_url.trim()
      : null;

  return { taskId, status, outputUrl };
}

/**
 * GET `/contents/generations/tasks/{id}` — poll task status.
 * @see https://docs.byteplus.com/en/docs/ModelArk/Video_Generation_API
 */
export async function fetchBytePlusVideoTask(taskId: string): Promise<BytePlusTaskPoll> {
  const apiKey = getBytePlusApiKey();
  const res = await fetch(
    `${bytePlusApiBaseUrl()}/contents/generations/tasks/${encodeURIComponent(taskId)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store"
    }
  );

  const json = (await res.json()) as BytePlusTaskEnvelope;
  if (!res.ok) {
    const msg = bytePlusErrorFromEnvelope(json) ?? `BytePlus task poll failed (${res.status})`;
    throw new BytePlusApiError(msg, res.status >= 400 ? res.status : 502);
  }

  const statusRaw = json.status ?? "unknown";
  const status = normalizeBytePlusTerminalStatus(statusRaw);
  const outputUrl =
    typeof json.content?.video_url === "string" && json.content.video_url.trim()
      ? json.content.video_url.trim()
      : null;
  const error = status === "failed" ? bytePlusErrorFromEnvelope(json) : null;

  if (status === "failed") {
    console.error("[byteplus-api] task failed", { taskId, status: statusRaw, error });
  }

  return { status, outputUrl, error, taskId };
}
