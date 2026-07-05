import { env } from "@/lib/env";

export type EnhanceType =
  | { kind: "upscale"; scale: "2x" | "4x" }
  | { kind: "remove_background" }
  | { kind: "enhance_quality" }
  | { kind: "remove_noise" };

import {
  creditsForImageModel,
  creditsForTts,
  creditsForVideoModel,
  isCreditsBillingEnabled
} from "@/lib/credits-charge";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";

export const CREDIT_COSTS = {
  /** Atlas image default (Flux Dev tier) with markup — override per model in /api/generate-image. */
  enhance: creditsForImageModel("flux-dev"),
  /** Atlas video default (Seedance 2.0 tier) with markup. */
  video: creditsForVideoModel("seedance-2"),
  /** TTS default for ~100 chars at current MiniMax HD rates — use creditsForTts({ characterCount }) at runtime. */
  tts: creditsForTts({ characterCount: 100, modelId: MINIMAX_TTS_MODEL_ID })
} as const;

/** Re-export for UI that shows test-mode vs live billing. */
export { isCreditsBillingEnabled };

export const replicateModels = {
  upscale: process.env.REPLICATE_MODEL_UPSCALE ?? "nightmareai/real-esrgan",
  removeBg: process.env.REPLICATE_MODEL_REMOVE_BG ?? "cjwbw/rembg",
  enhance: process.env.REPLICATE_MODEL_ENHANCE ?? "sczhou/codeformer",
  denoise: process.env.REPLICATE_MODEL_DENOISE ?? "sczhou/codeformer"
} as const;

