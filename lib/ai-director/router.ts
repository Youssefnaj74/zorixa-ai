import { getDirectorRoutingConfig } from "@/lib/ai-director/config";
import { resolveDirectorStyleInput } from "@/lib/ai-director/detect-style";
import { getDirectorModelInfo } from "@/lib/ai-director/model-info";
import type {
  DirectorQualityPreset,
  DirectorRouteAction,
  DirectorRouteResult,
  DirectorResolvedStyle,
  DirectorStyleInput
} from "@/lib/ai-director/types";
import {
  KLING_V3_BILLING_RESOLUTION,
  KLING_V3_COMPOSER_ID
} from "@/lib/atlas-kling-v3-video";

function pickModelForQuality(
  styleResolved: DirectorResolvedStyle,
  stylePrimary: string,
  qualityPreset: DirectorQualityPreset
): string {
  const preset = getDirectorRoutingConfig().qualityPresets[qualityPreset];
  if (preset.useStylePrimary) return stylePrimary;
  return preset.byStyle?.[styleResolved] ?? preset.default ?? stylePrimary;
}

function buildModelChain(primary: string, fallbacks: string[]): string[] {
  return [...new Set([primary, ...fallbacks].filter(Boolean))];
}

export function resolveDirectorRoute(args: {
  style: DirectorStyleInput;
  prompt: string;
  hasStartImage: boolean;
  qualityPreset?: DirectorQualityPreset;
  forceModelId?: string | null;
}): DirectorRouteResult {
  const qualityPreset = args.qualityPreset ?? "balanced";
  const styleResolved = resolveDirectorStyleInput(args.style, args.prompt);
  const styleConfig = getDirectorRoutingConfig().styles[styleResolved];
  const slot = args.hasStartImage ? styleConfig.imageToVideo : styleConfig.textToVideo;
  const routeAction: DirectorRouteAction = args.hasStartImage ? "image" : "text";

  const presetConfig = getDirectorRoutingConfig().qualityPresets[qualityPreset];
  const stylePrimaryModelId = pickModelForQuality(styleResolved, slot.primary, qualityPreset);
  const routeResolution = presetConfig.resolution?.trim() || "720p";
  const modelId =
    typeof args.forceModelId === "string" && args.forceModelId.trim()
      ? args.forceModelId.trim()
      : stylePrimaryModelId;

  const modelChain = buildModelChain(stylePrimaryModelId, slot.fallbacks);
  const info = getDirectorModelInfo(modelId);
  const resolution =
    modelId === KLING_V3_COMPOSER_ID ? KLING_V3_BILLING_RESOLUTION : routeResolution;

  return {
    styleRequested: args.style,
    styleResolved,
    qualityPreset,
    stylePrimaryModelId,
    modelId,
    fallbackModelIds: slot.fallbacks,
    modelChain,
    routeAction,
    actionTab: args.hasStartImage ? "Image to Video" : "Text to Video",
    resolution,
    modelSummary: info.summary,
    whyBullets: info.whyBullets
  };
}

/** Fast preset → Atlas fast endpoint where supported (Seedance, Vidu, etc.). */
export function directorSpeedTierForQualityPreset(
  preset: DirectorQualityPreset
): "standard" | "fast" {
  return preset === "fast" ? "fast" : "standard";
}
