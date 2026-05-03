import { env } from "@/lib/env";

export type EnhanceType =
  | { kind: "upscale"; scale: "2x" | "4x" }
  | { kind: "remove_background" }
  | { kind: "enhance_quality" }
  | { kind: "remove_noise" };

export const CREDIT_COSTS = {
  /** Set to 0 for free testing; restore to 5 (or your plan) for production. */
  enhance: 0,
  /** Set to 0 for free testing; restore to 20 (or your plan) for production. */
  video: 0
} as const;

export const replicateModels = {
  upscale: process.env.REPLICATE_MODEL_UPSCALE ?? "nightmareai/real-esrgan",
  removeBg: process.env.REPLICATE_MODEL_REMOVE_BG ?? "cjwbw/rembg",
  enhance: process.env.REPLICATE_MODEL_ENHANCE ?? "sczhou/codeformer",
  denoise: process.env.REPLICATE_MODEL_DENOISE ?? "sczhou/codeformer"
} as const;

