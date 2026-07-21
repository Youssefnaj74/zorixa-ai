import {
  MINIMAX_API_BASE,
  assertMinimaxBaseResp,
  minimaxAuthHeaders,
  resolveMinimaxApiKey,
  type MinimaxBaseResp
} from "@/lib/tts/providers/minimax/client";

/** Prefix for MiniMax video task IDs returned to the client (GET poll routes by prefix). */
export const MINIMAX_VIDEO_PREDICTION_PREFIX = "minimax-video:";

export class MinimaxVideoApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly minimaxStatusCode?: number
  ) {
    super(message);
    this.name = "MinimaxVideoApiError";
  }
}

export function encodeMinimaxVideoPredictionId(taskId: string): string {
  return `${MINIMAX_VIDEO_PREDICTION_PREFIX}${taskId}`;
}

export function decodeMinimaxVideoPredictionId(predictionId: string): string | null {
  const trimmed = predictionId.trim();
  if (!trimmed.startsWith(MINIMAX_VIDEO_PREDICTION_PREFIX)) return null;
  const taskId = trimmed.slice(MINIMAX_VIDEO_PREDICTION_PREFIX.length).trim();
  return taskId.length > 0 ? taskId : null;
}

export function isMinimaxVideoPredictionId(predictionId: string): boolean {
  return decodeMinimaxVideoPredictionId(predictionId) !== null;
}

export type MinimaxVideoResolution = "720P" | "768P" | "1080P";

export type MinimaxVideoCreateBody = {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: MinimaxVideoResolution;
  prompt_optimizer?: boolean;
  first_frame_image?: string;
};

type MinimaxCreateTaskResp = {
  task_id?: string;
  base_resp?: MinimaxBaseResp;
};

type MinimaxQueryTaskResp = {
  task_id?: string;
  status?: string;
  file_id?: string | number;
  base_resp?: MinimaxBaseResp;
};

type MinimaxFileRetrieveResp = {
  file?: { download_url?: string; filename?: string };
  base_resp?: MinimaxBaseResp;
};

export type MinimaxVideoTaskPoll = {
  taskId: string;
  /** Atlas-compatible status for the studio poll loop. */
  status: string;
  rawStatus: string;
  outputUrl: string | null;
  error: string | null;
};

/** Map MiniMax video task status → Atlas-style statuses the client already understands. */
export function mapMinimaxVideoStatusToAtlas(raw: string | undefined | null): string {
  const s = (raw ?? "").trim();
  const lower = s.toLowerCase();
  if (lower === "success") return "succeeded";
  if (lower === "fail" || lower === "failed") return "failed";
  if (lower === "preparing" || lower === "queueing" || lower === "processing") {
    return "processing";
  }
  return s || "processing";
}

async function minimaxGetJson<T>(
  pathWithQuery: string,
  apiKey?: string
): Promise<{ json: T; raw: string; status: number }> {
  const key = resolveMinimaxApiKey(apiKey);
  const res = await fetch(`${MINIMAX_API_BASE}${pathWithQuery}`, {
    method: "GET",
    headers: minimaxAuthHeaders(key),
    cache: "no-store"
  });
  const raw = await res.text().catch(() => "");
  let json = {} as T;
  if (raw.trim()) {
    try {
      json = JSON.parse(raw) as T;
    } catch {
      throw new MinimaxVideoApiError(
        raw.trim() || `MiniMax video API returned invalid JSON (${res.status})`,
        res.status >= 400 ? res.status : 502
      );
    }
  }
  if (!res.ok) {
    throw new MinimaxVideoApiError(
      raw.trim() || `MiniMax video API failed (${res.status})`,
      res.status >= 400 ? res.status : 502
    );
  }
  return { json, raw, status: res.status };
}

export async function createMinimaxVideoTask(
  body: MinimaxVideoCreateBody,
  apiKey?: string
): Promise<{ taskId: string }> {
  const key = resolveMinimaxApiKey(apiKey);
  const res = await fetch(`${MINIMAX_API_BASE}/v1/video_generation`, {
    method: "POST",
    headers: minimaxAuthHeaders(key),
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const raw = await res.text().catch(() => "");
  let json = {} as MinimaxCreateTaskResp;
  if (raw.trim()) {
    try {
      json = JSON.parse(raw) as MinimaxCreateTaskResp;
    } catch {
      throw new MinimaxVideoApiError(
        raw.trim() || `MiniMax create video failed (${res.status})`,
        res.status >= 400 ? res.status : 502
      );
    }
  }

  try {
    assertMinimaxBaseResp(json.base_resp, res.status, raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "MiniMax create video failed";
    throw new MinimaxVideoApiError(
      msg,
      res.status >= 400 ? res.status : 502,
      json.base_resp?.status_code
    );
  }

  if (!res.ok) {
    throw new MinimaxVideoApiError(
      json.base_resp?.status_msg?.trim() || `MiniMax create video failed (${res.status})`,
      res.status >= 400 ? res.status : 502,
      json.base_resp?.status_code
    );
  }

  const taskId = typeof json.task_id === "string" ? json.task_id.trim() : "";
  if (!taskId) {
    throw new MinimaxVideoApiError("MiniMax did not return a task_id", 502);
  }
  return { taskId };
}

export async function retrieveMinimaxVideoDownloadUrl(
  fileId: string,
  apiKey?: string
): Promise<string> {
  const { json, raw, status } = await minimaxGetJson<MinimaxFileRetrieveResp>(
    `/v1/files/retrieve?file_id=${encodeURIComponent(fileId)}`,
    apiKey
  );
  assertMinimaxBaseResp(json.base_resp, status, raw);
  const url = json.file?.download_url?.trim();
  if (!url) {
    throw new MinimaxVideoApiError("MiniMax file retrieve returned no download_url", 502);
  }
  return url;
}

export async function fetchMinimaxVideoTask(
  taskId: string,
  apiKey?: string
): Promise<MinimaxVideoTaskPoll> {
  const { json, raw, status } = await minimaxGetJson<MinimaxQueryTaskResp>(
    `/v1/query/video_generation?task_id=${encodeURIComponent(taskId)}`,
    apiKey
  );
  assertMinimaxBaseResp(json.base_resp, status, raw);

  const rawStatus = typeof json.status === "string" ? json.status : "";
  const mapped = mapMinimaxVideoStatusToAtlas(rawStatus);
  const fileId =
    json.file_id !== undefined && json.file_id !== null
      ? String(json.file_id).trim()
      : "";

  if (mapped === "failed") {
    return {
      taskId,
      status: "failed",
      rawStatus,
      outputUrl: null,
      error: json.base_resp?.status_msg?.trim() || "MiniMax video generation failed"
    };
  }

  if (mapped === "succeeded") {
    if (!fileId) {
      return {
        taskId,
        status: "failed",
        rawStatus,
        outputUrl: null,
        error: "MiniMax task succeeded but returned no file_id"
      };
    }
    try {
      const outputUrl = await retrieveMinimaxVideoDownloadUrl(fileId, apiKey);
      return {
        taskId,
        status: "succeeded",
        rawStatus,
        outputUrl,
        error: null
      };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "MiniMax file retrieve failed";
      return {
        taskId,
        status: "failed",
        rawStatus,
        outputUrl: null,
        error: msg
      };
    }
  }

  return {
    taskId,
    status: mapped,
    rawStatus,
    outputUrl: null,
    error: null
  };
}
