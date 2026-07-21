import {
  HAILUO_23_COMPOSER_ID,
  normalizeHailuo23I2vDurationSeconds
} from "@/lib/atlas-hailuo-video";
import type { AtlasVideoRouteAction } from "@/lib/atlas-video-model-ids";
import { env } from "@/lib/env";
import {
  createMinimaxVideoTask,
  encodeMinimaxVideoPredictionId,
  type MinimaxVideoCreateBody,
  type MinimaxVideoResolution
} from "@/lib/minimax-video-api";

/** Official MiniMax Hailuo 2.3 model id (T2V + I2V). */
export const MINIMAX_HAILUO_23_MODEL = "MiniMax-Hailuo-2.3";

/** MiniMax T2V default — Atlas T2V Pro is fixed 5s; MiniMax starts at 6s. */
export const MINIMAX_HAILUO_23_T2V_DURATION_SECONDS = 6;

export function isMinimaxHailuoVideoEnabled(): boolean {
  return env.minimaxHailuoVideoEnabled && env.minimaxApiKey.length > 0;
}

function minimaxHailuoVideoEnabledEnvRaw(): string {
  const raw = process.env.MINIMAX_HAILUO_VIDEO_ENABLED;
  if (raw === undefined) return "(unset)";
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : "(empty)";
}

export type MinimaxHailuoRoutingDiagnostic = {
  request: {
    videoModel: string;
    action: AtlasVideoRouteAction;
  };
  isMinimaxHailuoVideoEnabled: boolean;
  env: {
    MINIMAX_HAILUO_VIDEO_ENABLED: string;
    MINIMAX_HAILUO_VIDEO_ENABLED_parsed: boolean;
    MINIMAX_API_KEY_exists: boolean;
  };
  shouldUseMinimaxForHailuo: boolean;
  actionSupportedForMinimax: boolean;
  hailuoMinimaxEligible: boolean;
  skipReasons: string[];
};

/**
 * MiniMax is primary for Hailuo 2.3 Text-to-Video and Image-to-Video.
 * On create/immediate failure (incl. insufficient balance), fall back to Atlas.
 */
export function shouldUseMinimaxForHailuo(composerModelId: string): boolean {
  return composerModelId === HAILUO_23_COMPOSER_ID && isMinimaxHailuoVideoEnabled();
}

export function diagnoseMinimaxHailuoRouting(input: {
  videoModel: string;
  action: AtlasVideoRouteAction;
}): MinimaxHailuoRoutingDiagnostic {
  const skipReasons: string[] = [];
  if (input.videoModel !== HAILUO_23_COMPOSER_ID) {
    skipReasons.push(`wrong model: "${input.videoModel}" (expected "${HAILUO_23_COMPOSER_ID}")`);
  }
  if (!env.minimaxHailuoVideoEnabled) {
    skipReasons.push(
      `env disabled: MINIMAX_HAILUO_VIDEO_ENABLED=${minimaxHailuoVideoEnabledEnvRaw()}`
    );
  }
  if (env.minimaxApiKey.length === 0) {
    skipReasons.push("missing api key: MINIMAX_API_KEY is empty or unset");
  }

  const shouldUse = shouldUseMinimaxForHailuo(input.videoModel);
  const actionSupported = input.action === "text" || input.action === "image";
  if (shouldUse && !actionSupported) {
    skipReasons.push(`unsupported action: "${input.action}"`);
  }

  return {
    request: {
      videoModel: input.videoModel,
      action: input.action
    },
    isMinimaxHailuoVideoEnabled: isMinimaxHailuoVideoEnabled(),
    env: {
      MINIMAX_HAILUO_VIDEO_ENABLED: minimaxHailuoVideoEnabledEnvRaw(),
      MINIMAX_HAILUO_VIDEO_ENABLED_parsed: env.minimaxHailuoVideoEnabled,
      MINIMAX_API_KEY_exists: env.minimaxApiKey.length > 0
    },
    shouldUseMinimaxForHailuo: shouldUse,
    actionSupportedForMinimax: actionSupported,
    hailuoMinimaxEligible: shouldUse && actionSupported,
    skipReasons
  };
}

export function logMinimaxHailuoRoutingDiagnostic(
  label: string,
  diagnostic: MinimaxHailuoRoutingDiagnostic,
  extra?: Record<string, unknown>
): void {
  console.log(`[generate-video][minimax-hailuo-routing] ${label}`, {
    ...diagnostic,
    ...extra
  });
}

/**
 * MiniMax duration/resolution matrix for Hailuo 2.3:
 * - 1080P → 6s only
 * - 768P → 6s or 10s
 */
export function resolveMinimaxHailuoDurationAndResolution(input: {
  action: "text" | "image";
  durationSec?: number;
}): { duration: number; resolution: MinimaxVideoResolution } {
  if (input.action === "text") {
    const raw = input.durationSec;
    if (typeof raw === "number" && Number.isFinite(raw) && Math.round(raw) >= 8) {
      return { duration: 10, resolution: "768P" };
    }
    return {
      duration: MINIMAX_HAILUO_23_T2V_DURATION_SECONDS,
      resolution: "1080P"
    };
  }

  const duration = normalizeHailuo23I2vDurationSeconds(input.durationSec ?? 6);
  if (duration >= 10) {
    return { duration: 10, resolution: "768P" };
  }
  return { duration: 6, resolution: "1080P" };
}

export function buildMinimaxHailuoVideoBody(input: {
  action: "text" | "image";
  prompt: string;
  durationSec?: number;
  imageUrl?: string;
  promptOptimizer?: boolean;
}): MinimaxVideoCreateBody {
  const { duration, resolution } = resolveMinimaxHailuoDurationAndResolution({
    action: input.action,
    durationSec: input.durationSec
  });

  const body: MinimaxVideoCreateBody = {
    model: MINIMAX_HAILUO_23_MODEL,
    prompt: input.prompt,
    duration,
    resolution,
    prompt_optimizer: input.promptOptimizer ?? true
  };

  if (input.action === "image") {
    const image = input.imageUrl?.trim();
    if (!image) {
      throw new Error("MiniMax Hailuo Image to Video requires first_frame_image");
    }
    body.first_frame_image = image;
    // Match Atlas I2V default: expansion off unless client overrides.
    if (input.promptOptimizer === undefined) {
      body.prompt_optimizer = false;
    }
  }

  return body;
}

export type MinimaxHailuoSubmitResult =
  | { ok: true; predictionId: string; status: string; outputUrl: string | null }
  | { ok: false; error: string };

/** Submit Hailuo 2.3 to MiniMax. Returns failure info for Atlas fallback. */
export async function submitMinimaxHailuoVideoTask(
  body: MinimaxVideoCreateBody
): Promise<MinimaxHailuoSubmitResult> {
  try {
    const created = await createMinimaxVideoTask(body);
    return {
      ok: true,
      predictionId: encodeMinimaxVideoPredictionId(created.taskId),
      status: "processing",
      outputUrl: null
    };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "MiniMax Hailuo video generation failed";
    console.warn("[minimax-hailuo] create failed, will fallback to Atlas", { error: msg });
    return { ok: false, error: msg };
  }
}
