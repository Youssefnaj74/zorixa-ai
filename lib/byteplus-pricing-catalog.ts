/**
 * BytePlus ModelArk wholesale estimates for Dreamina Seedance 2.0.
 *
 * Official billing is token-based; per-second figures below are derived from
 * BytePlus resource-pack token rates (720p/1080p, with/without video reference input).
 * @see https://docs.byteplus.com/en/docs/ModelArk/2191775
 */

import type { VideoPricingOptions } from "@/lib/atlas-pricing-catalog";
import { VIDEO_SOUNDTRACK_MULTIPLIER } from "@/lib/atlas-pricing-catalog";

function normalizeVideoDurationSeconds(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 5;
  return Math.min(60, Math.max(1, Math.round(raw)));
}

function normalizeVideoResolutionTier(raw: unknown): "480p" | "720p" | "1080p" | "4k" {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v === "4k" || v === "2160p") return "4k";
  if (v === "1080p") return "1080p";
  if (v === "480p" || v === "450p" || v === "540p") return "480p";
  return "720p";
}

/** USD per generated second — standard tier, no reference video in request. */
const BYTEPLUS_SEEDANCE_STANDARD_RATES = {
  "720p": 0.1441,
  "1080p": 0.377,
  "480p": 0.1441,
  "4k": 0.377
} as const;

/** USD per second when reference video/image inputs are included (lower token tier). */
const BYTEPLUS_SEEDANCE_REFERENCE_INPUT_RATES = {
  "720p": 0.0885,
  "1080p": 0.2301,
  "480p": 0.0885,
  "4k": 0.2301
} as const;

export type BytePlusCostWorkflow =
  | "text-to-video"
  | "image-to-video"
  | "reference-to-video"
  | "video-editing"
  | "video-extension";

function usesReferenceInputRate(workflow: BytePlusCostWorkflow): boolean {
  return (
    workflow === "reference-to-video" ||
    workflow === "video-editing" ||
    workflow === "video-extension" ||
    workflow === "image-to-video"
  );
}

/** Estimated BytePlus wholesale USD for a Seedance 2.0 standard-tier run. */
export function byteplusSeedanceUsdForOptions(
  opts: VideoPricingOptions & { workflow?: BytePlusCostWorkflow } = {}
): number {
  const duration = normalizeVideoDurationSeconds(opts.durationSeconds);
  const resolution = normalizeVideoResolutionTier(opts.resolution);
  const workflow = opts.workflow ?? "text-to-video";
  const rateTable = usesReferenceInputRate(workflow)
    ? BYTEPLUS_SEEDANCE_REFERENCE_INPUT_RATES
    : BYTEPLUS_SEEDANCE_STANDARD_RATES;
  const perSecond = rateTable[resolution] ?? rateTable["720p"];
  const soundtrackMultiplier = opts.generateAudio ? VIDEO_SOUNDTRACK_MULTIPLIER : 1;
  return perSecond * duration * soundtrackMultiplier;
}
