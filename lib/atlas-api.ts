import { requireAtlasCloudApiKey } from "@/lib/env";

const ATLAS_MODEL_BASE = "https://api.atlascloud.ai/api/v1/model";

/** Fixed model for studio video route (Atlas slug). */
export const ATLAS_SEEDANCE_20_I2V_MODEL = "bytedance/seedance-2.0/image-to-video";

export class AtlasApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AtlasApiError";
  }
}

type AtlasEnvelope = {
  data?: {
    id?: string;
    status?: string;
    outputs?: string[];
    error?: string | null;
  };
  message?: string;
};

function getAtlasApiKey(): string {
  try {
    return requireAtlasCloudApiKey();
  } catch {
    throw new AtlasApiError("Missing ATLASCLOUD_API_KEY", 500);
  }
}

const ALLOWED_ASPECTS = new Set(["16:9", "9:16", "1:1", "4:3"]);
const ALLOWED_RESOLUTIONS = new Set(["480p", "720p", "1080p"]);

function normalizeAspectRatio(raw: string): string {
  const v = raw.trim();
  return ALLOWED_ASPECTS.has(v) ? v : "16:9";
}

function normalizeResolutionTier(raw: string): string {
  const v = raw.trim().toLowerCase();
  return ALLOWED_RESOLUTIONS.has(v) ? v : "1080p";
}

function resolutionShortSidePx(resolution: string): number {
  switch (resolution) {
    case "1080p":
      return 1080;
    case "720p":
      return 720;
    case "480p":
    default:
      return 480;
  }
}

function dimensionsForAspectResolution(
  aspectRatio: string,
  resolution: string
): { width: number; height: number } {
  const s = resolutionShortSidePx(resolution);
  switch (aspectRatio) {
    case "16:9":
      return { width: Math.round((s * 16) / 9), height: s };
    case "9:16":
      return { width: s, height: Math.round((s * 16) / 9) };
    case "1:1":
      return { width: s, height: s };
    case "4:3":
      return { width: Math.round((s * 4) / 3), height: s };
    default:
      return { width: Math.round((s * 16) / 9), height: s };
  }
}

function clampDurationSeconds(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.min(60, Math.max(1, Math.round(n)));
}

export type AtlasGenerateVideoParams = {
  image_url: string;
  prompt: string;
  duration: number;
  aspect_ratio: string;
  resolution: string;
};

export type AtlasGenerateVideoResult =
  | { mode: "sync"; outputUrl: string }
  | { mode: "async"; predictionId: string };

/**
 * Submits Seedance 2.0 image-to-video on Atlas Cloud.
 * @see https://api.atlascloud.ai/api/v1/model/generateVideo
 */
export async function atlasGenerateVideo(
  params: AtlasGenerateVideoParams
): Promise<AtlasGenerateVideoResult> {
  const apiKey = getAtlasApiKey();
  const aspect = normalizeAspectRatio(params.aspect_ratio);
  const resolution = normalizeResolutionTier(params.resolution);
  const { width, height } = dimensionsForAspectResolution(aspect, resolution);
  const duration = clampDurationSeconds(params.duration);

  const body = {
    model: ATLAS_SEEDANCE_20_I2V_MODEL,
    prompt: params.prompt.trim(),
    image: params.image_url.trim(),
    width,
    height,
    duration,
    fps: 24
  };

  const res = await fetch(`${ATLAS_MODEL_BASE}/generateVideo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const json = (await res.json()) as AtlasEnvelope;
  if (!res.ok) {
    const msg = json.message ?? `Atlas generateVideo failed (${res.status})`;
    throw new AtlasApiError(msg, res.status >= 400 ? res.status : 502);
  }

  const data = json.data;
  const predictionId = data?.id;
  if (!predictionId) {
    throw new AtlasApiError("Atlas did not return a prediction id", 502);
  }

  const st = data.status;
  if (st === "completed" || st === "succeeded") {
    const out = data.outputs?.[0];
    if (typeof out === "string" && out.length > 0) {
      return { mode: "sync", outputUrl: out };
    }
  }

  return { mode: "async", predictionId };
}

export type AtlasPredictionPoll = {
  status: string;
  outputUrl: string | null;
  error: string | null;
};

/** GET `/api/v1/model/prediction/{id}` — used by generations poll route. */
export async function fetchAtlasPrediction(predictionId: string): Promise<AtlasPredictionPoll> {
  const apiKey = getAtlasApiKey();
  const res = await fetch(`${ATLAS_MODEL_BASE}/prediction/${predictionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store"
  });

  const json = (await res.json()) as AtlasEnvelope;
  if (!res.ok) {
    const msg = json.message ?? `Atlas prediction poll failed (${res.status})`;
    throw new AtlasApiError(msg, res.status >= 400 ? res.status : 502);
  }

  const data = json.data;
  const status = data?.status ?? "unknown";
  const outputUrl =
    typeof data?.outputs?.[0] === "string" && data.outputs[0].length > 0 ? data.outputs[0] : null;
  const error =
    typeof data?.error === "string" && data.error.length > 0
      ? data.error
      : typeof json.message === "string"
        ? json.message
        : null;

  return { status, outputUrl, error };
}
