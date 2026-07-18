import type { BadgeVariant } from "@/components/ui/Badge";

import {
  AUDIO_TO_VIDEO_COMPOSER_IDS,
  INFINITETALK_COMPOSER_ID,
  OMNI_HUMAN_15_COMPOSER_ID,
  VEED_FABRIC_1_COMPOSER_ID,
  VEED_FABRIC_1_FAST_COMPOSER_ID
} from "@/lib/atlas-audio-to-video";
import {
  GEMINI_OMNI_FLASH_DURATION_OPTIONS,
  GEMINI_OMNI_FLASH_I2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_MAX_IMAGES,
  GEMINI_OMNI_FLASH_REFERENCE_DURATION_OPTIONS,
  GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS,
  GEMINI_OMNI_FLASH_RESOLUTION_OPTIONS,
  GEMINI_OMNI_FLASH_R2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_T2V_COMPOSER_ID,
  geminiOmniFlashAspectFromUi,
  geminiOmniFlashComposerSupportsAction,
  isGeminiOmniFlashComposerId,
  normalizeGeminiOmniFlashDurationSeconds,
  normalizeGeminiOmniFlashReferenceDurationSeconds
} from "@/lib/atlas-gemini-omni-video";
import {
  GROK_IMAGINE_VIDEO_ASPECT_OPTIONS,
  GROK_IMAGINE_VIDEO_DURATION_OPTIONS,
  GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_MAX_REFERENCE_IMAGES,
  GROK_IMAGINE_VIDEO_REFERENCE_DURATION_OPTIONS,
  GROK_IMAGINE_VIDEO_RESOLUTION_OPTIONS,
  GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID,
  grokImagineVideoAspectFromUi,
  grokImagineVideoComposerSupportsAction,
  isGrokImagineVideoComposerId,
  normalizeGrokImagineVideoDurationSeconds,
  normalizeGrokImagineVideoReferenceDurationSeconds
} from "@/lib/atlas-grok-video";
import { KLING_26_MOTION_COMPOSER_ID } from "@/lib/atlas-kling-motion-control";
import {
  KLING_V3_COMPOSER_ID,
  kling30ProComposerSupportsEndFrame,
  klingV3AspectFromUi,
  klingV3AspectOptionsForUi,
  klingV3DurationOptionsForUi,
  normalizeKlingV3DurationSeconds
} from "@/lib/atlas-kling-v3-video";
import {
  HAPPYHORSE_1_COMPOSER_ID,
  HAPPYHORSE_REFERENCE_TO_VIDEO_MAX_IMAGES,
  HAPPYHORSE_VIDEO_EDIT_MAX_IMAGES,
  isHappyHorseComposerId
} from "@/lib/atlas-happyhorse-video";
import {
  HAILUO_23_COMPOSER_ID,
  HAILUO_23_I2V_DURATION_OPTIONS,
  HAILUO_23_T2V_DURATION_SECONDS,
  isHailuo23ComposerId,
  normalizeHailuo23I2vDurationSeconds
} from "@/lib/atlas-hailuo-video";
import {
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_IMAGES,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS,
  seedanceComposerSupportsReferenceMedia
} from "@/lib/atlas-seedance-reference-video";
import {
  WAN_27_COMPOSER_ID,
  WAN_27_REFERENCE_DURATION_OPTIONS,
  WAN_27_REFERENCE_MAX_IMAGES,
  WAN_27_REFERENCE_MAX_VIDEOS,
  WAN_27_REFERENCE_MAX_VOICE_AUDIOS,
  WAN_27_VIDEO_EDIT_MAX_IMAGES,
  wan27DurationOptionsForTab,
  isWan27ComposerId,
  wan27ComposerSupportsReferenceMedia
} from "@/lib/atlas-wan-27-video";
import {
  VEO_31_COMPOSER_ID,
  VEO_31_ASPECT_OPTIONS,
  VEO_31_DURATION_OPTIONS,
  VEO_31_REFERENCE_DURATION_SECONDS,
  VEO_31_REFERENCE_TO_VIDEO_MAX_IMAGES,
  isVeo31ComposerId,
  normalizeVeo31DurationSeconds,
  veo31AspectFromUi
} from "@/lib/atlas-veo31-video";
import {
  WAN_22_CHARACTER_SWAP_COMPOSER_ID,
  videoComposerSupportsWanCharacterSwap
} from "@/lib/atlas-wan-character-swap";
import {
  videoComposerSupportsHappyHorseReference,
  videoComposerSupportsHappyHorseVideoEdit,
  videoComposerSupportsVeo31Reference,
  videoComposerSupportsMotionControl,
  videoComposerSupportsViduStartEnd,
  videoComposerSupportsWan27Reference,
  videoComposerSupportsWan27VideoEdit,
  videoComposerSupportsWanVideoToVideo
} from "@/lib/atlas-video-model-ids";
import {
  VIDU_Q3_COMPOSER_ID,
  VIDU_Q3_PRO_COMPOSER_ID,
  VIDU_Q3_PRO_RESOLUTION_OPTIONS,
  VIDU_Q3_REFERENCE_TO_VIDEO_MAX_IMAGES,
  VIDU_Q3_REFERENCE_RESOLUTION_OPTIONS
} from "@/lib/atlas-vidu-video";

export const KLING_30_PRO_MODEL_ID = KLING_V3_COMPOSER_ID;

export { KLING_26_MOTION_COMPOSER_ID };
export { HAPPYHORSE_1_COMPOSER_ID };
export { WAN_27_COMPOSER_ID };
export { WAN_22_CHARACTER_SWAP_COMPOSER_ID };
export { VIDU_Q3_COMPOSER_ID, VIDU_Q3_PRO_COMPOSER_ID, VIDU_Q3_PRO_RESOLUTION_OPTIONS, VIDU_Q3_REFERENCE_RESOLUTION_OPTIONS };

export type BottomBarModel = {
  id: string;
  label: string;
  badge?: BadgeVariant;
  locked?: boolean;
};

export const BOTTOM_BAR_MODELS: BottomBarModel[] = [
  { id: GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID, label: "Grok Imagine", badge: "newTeal" },
  { id: GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID, label: "Grok Imagine v1.5", badge: "newTeal" },
  { id: GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID, label: "Grok Imagine", badge: "newTeal" },
  { id: GEMINI_OMNI_FLASH_T2V_COMPOSER_ID, label: "Gemini Omni Flash", badge: "newTeal" },
  { id: GEMINI_OMNI_FLASH_I2V_COMPOSER_ID, label: "Gemini Omni Flash", badge: "newTeal" },
  { id: GEMINI_OMNI_FLASH_R2V_COMPOSER_ID, label: "Gemini Omni Flash", badge: "newTeal" },
  { id: KLING_30_PRO_MODEL_ID, label: "Kling 3.0 Pro", badge: "pro" },
  { id: KLING_26_MOTION_COMPOSER_ID, label: "Kling 2.6 Motion", badge: "pro" },
  { id: "seedance-2", label: "Seedance 2.0", badge: "newTeal" },
  { id: "seedance-1-5", label: "Seedance 1.5 Pro", badge: "pro" },
  { id: "wan-2-6", label: "Wan 2.6" },
  { id: WAN_27_COMPOSER_ID, label: "Wan 2.7", badge: "newTeal" },
  { id: WAN_22_CHARACTER_SWAP_COMPOSER_ID, label: "Wan 2.2 Character Swap", badge: "newTeal" },
  { id: HAPPYHORSE_1_COMPOSER_ID, label: "HappyHorse 1.0", badge: "newTeal" },
  { id: HAILUO_23_COMPOSER_ID, label: "Hailuo 2.3", badge: "newTeal" },
  { id: "google-veo-3-1", label: "Google Veo 3.1", badge: "newTeal" },
  { id: VIDU_Q3_COMPOSER_ID, label: "Vidu Q3", badge: "newTeal" },
  { id: VIDU_Q3_PRO_COMPOSER_ID, label: "Vidu Q3-Pro", badge: "pro" }
];

export const AUDIO_TO_VIDEO_BOTTOM_BAR_MODELS: BottomBarModel[] = [
  { id: INFINITETALK_COMPOSER_ID, label: "InfiniteTalk" },
  { id: VEED_FABRIC_1_COMPOSER_ID, label: "VEED Fabric 1.0", badge: "newTeal" },
  { id: VEED_FABRIC_1_FAST_COMPOSER_ID, label: "VEED Fabric 1.0 Fast", badge: "newTeal" },
  { id: OMNI_HUMAN_15_COMPOSER_ID, label: "OmniHuman 1.5", badge: "newTeal" }
];

const TEXT_TO_VIDEO_PROMPT_ONLY_IDS = new Set(BOTTOM_BAR_MODELS.map((m) => m.id));

export function videoComposerUsesTextOnlyLayout(
  composerModelId: string,
  actionTab: string
): boolean {
  return (
    (actionTab === "Text to Video" && TEXT_TO_VIDEO_PROMPT_ONLY_IDS.has(composerModelId)) ||
    actionTab === "Reference to Video"
  );
}

export function videoComposerSupportsEndFrame(composerModelId: string): boolean {
  return (
    composerModelId === "seedance-2" ||
    composerModelId === "seedance-1-5" ||
    isVeo31ComposerId(composerModelId) ||
    isWan27ComposerId(composerModelId) ||
    kling30ProComposerSupportsEndFrame(composerModelId)
  );
}

export function videoComposerSupportsReferenceToVideo(composerModelId: string): boolean {
  return (
    composerModelId === "seedance-2" ||
    composerModelId === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID ||
    composerModelId === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID ||
    composerModelId === VIDU_Q3_COMPOSER_ID ||
    videoComposerSupportsHappyHorseReference(composerModelId) ||
    videoComposerSupportsWan27Reference(composerModelId) ||
    videoComposerSupportsVeo31Reference(composerModelId)
  );
}

export function videoComposerSupportsMotionControlTab(composerModelId: string): boolean {
  return videoComposerSupportsMotionControl(composerModelId);
}

export function videoComposerSupportsWanCharacterSwapTab(composerModelId: string): boolean {
  return videoComposerSupportsWanCharacterSwap(composerModelId);
}

export function characterSwapTabSupportsModel(composerModelId: string): boolean {
  return (
    videoComposerSupportsMotionControlTab(composerModelId) ||
    videoComposerSupportsWanCharacterSwapTab(composerModelId)
  );
}

export const CHARACTER_SWAP_BOTTOM_BAR_MODELS: BottomBarModel[] = BOTTOM_BAR_MODELS.filter((m) =>
  characterSwapTabSupportsModel(m.id)
);

export function videoComposerSupportsVideoEditTab(composerModelId: string): boolean {
  return (
    videoComposerSupportsWanVideoToVideo(composerModelId) ||
    videoComposerSupportsHappyHorseVideoEdit(composerModelId)
  );
}

export function videoToVideoTabUsesKlingMotion(composerModelId: string): boolean {
  return videoComposerSupportsMotionControlTab(composerModelId);
}

export function videoToVideoTabUsesWanCharacterSwap(composerModelId: string): boolean {
  return videoComposerSupportsWanCharacterSwapTab(composerModelId);
}

export function characterSwapTabUsesDualAssetPipeline(composerModelId: string): boolean {
  return characterSwapTabSupportsModel(composerModelId);
}

export function videoToVideoTabUsesDualAssetPipeline(composerModelId: string): boolean {
  return characterSwapTabUsesDualAssetPipeline(composerModelId);
}

export function videoToVideoTabUsesWanV2v(composerModelId: string): boolean {
  return videoComposerSupportsVideoEditTab(composerModelId);
}

export function videoToVideoTabUsesViduStartEnd(composerModelId: string): boolean {
  return videoComposerSupportsViduStartEnd(composerModelId);
}

export function videoComposerUsesCharacterSwapBarLayout(
  composerModelId: string,
  actionTab: string
): boolean {
  return actionTab === "Video to Video" && videoToVideoTabUsesDualAssetPipeline(composerModelId);
}

export function videoComposerUsesKlingMotionBarLayout(composerModelId: string, actionTab: string): boolean {
  return videoComposerUsesCharacterSwapBarLayout(composerModelId, actionTab);
}

export function atlasSpeedTierUiLabel(composerModelId: string, tier: "Standard" | "Fast"): string {
  if (composerModelId === KLING_26_MOTION_COMPOSER_ID) {
    return tier === "Fast" ? "Std" : "Pro";
  }
  if (composerModelId === WAN_22_CHARACTER_SWAP_COMPOSER_ID) {
    return tier === "Fast" ? "Pro" : "Std";
  }
  if (composerModelId === VIDU_Q3_COMPOSER_ID) {
    return tier === "Fast" ? "Mix" : "Q3";
  }
  if (composerModelId === VIDU_Q3_PRO_COMPOSER_ID) {
    return tier === "Fast" ? "Turbo" : "Pro";
  }
  return tier;
}

export function bottomBarModelsForActionTab(actionTab: string): BottomBarModel[] {
  if (actionTab === "Audio to Video") {
    return AUDIO_TO_VIDEO_BOTTOM_BAR_MODELS;
  }
  if (actionTab === "Reference to Video") {
    const referenceOrder = [
      GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
      GEMINI_OMNI_FLASH_R2V_COMPOSER_ID,
      "seedance-2",
      WAN_27_COMPOSER_ID,
      HAPPYHORSE_1_COMPOSER_ID,
      "google-veo-3-1",
      VIDU_Q3_COMPOSER_ID
    ];
    return referenceOrder
      .map((id) => BOTTOM_BAR_MODELS.find((m) => m.id === id))
      .filter((m): m is BottomBarModel => Boolean(m));
  }
  if (actionTab === "Video to Video") {
    return BOTTOM_BAR_MODELS.filter(
      (m) =>
        videoComposerSupportsVideoEditTab(m.id) ||
        videoComposerSupportsViduStartEnd(m.id) ||
        characterSwapTabSupportsModel(m.id)
    );
  }
  const studioOrder =
    actionTab === "Image to Video"
      ? [
          GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID,
          GEMINI_OMNI_FLASH_I2V_COMPOSER_ID,
          KLING_30_PRO_MODEL_ID,
          "seedance-2",
          "seedance-1-5",
          "wan-2-6",
          WAN_27_COMPOSER_ID,
          HAPPYHORSE_1_COMPOSER_ID,
          HAILUO_23_COMPOSER_ID,
          "google-veo-3-1",
          VIDU_Q3_PRO_COMPOSER_ID
        ]
      : [
          GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID,
          GEMINI_OMNI_FLASH_T2V_COMPOSER_ID,
          KLING_30_PRO_MODEL_ID,
          "seedance-2",
          "seedance-1-5",
          "wan-2-6",
          WAN_27_COMPOSER_ID,
          HAPPYHORSE_1_COMPOSER_ID,
          HAILUO_23_COMPOSER_ID,
          "google-veo-3-1",
          VIDU_Q3_PRO_COMPOSER_ID
        ];
  return studioOrder
    .map((id) => BOTTOM_BAR_MODELS.find((m) => m.id === id))
    .filter((m): m is BottomBarModel => Boolean(m));
}

export function videoComposerUsesAudioToVideoBarLayout(
  composerModelId: string,
  actionTab: string
): boolean {
  return actionTab === "Audio to Video";
}

export const REFERENCE_TO_VIDEO_MAX_IMAGES = 4;

export {
  HAPPYHORSE_REFERENCE_TO_VIDEO_MAX_IMAGES,
  HAPPYHORSE_VIDEO_EDIT_MAX_IMAGES,
  VEO_31_ASPECT_OPTIONS,
  VEO_31_DURATION_OPTIONS,
  VEO_31_REFERENCE_DURATION_SECONDS,
  VEO_31_REFERENCE_TO_VIDEO_MAX_IMAGES,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_IMAGES,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS,
  seedanceComposerSupportsReferenceMedia,
  WAN_27_REFERENCE_DURATION_OPTIONS,
  WAN_27_REFERENCE_MAX_IMAGES,
  WAN_27_REFERENCE_MAX_VIDEOS,
  WAN_27_REFERENCE_MAX_VOICE_AUDIOS,
  wan27ComposerSupportsReferenceMedia
};

export function referenceToVideoMaxImages(composerModelId: string): number {
  if (composerModelId === GEMINI_OMNI_FLASH_R2V_COMPOSER_ID) {
    return GEMINI_OMNI_FLASH_MAX_IMAGES;
  }
  if (composerModelId === GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID) {
    return GROK_IMAGINE_VIDEO_MAX_REFERENCE_IMAGES;
  }
  if (isVeo31ComposerId(composerModelId)) {
    return VEO_31_REFERENCE_TO_VIDEO_MAX_IMAGES;
  }
  if (isHappyHorseComposerId(composerModelId)) {
    return HAPPYHORSE_REFERENCE_TO_VIDEO_MAX_IMAGES;
  }
  if (composerModelId === "seedance-2") {
    return SEEDANCE_REFERENCE_TO_VIDEO_MAX_IMAGES;
  }
  if (isWan27ComposerId(composerModelId)) {
    return WAN_27_REFERENCE_MAX_IMAGES;
  }
  if (composerModelId === VIDU_Q3_COMPOSER_ID) {
    return VIDU_Q3_REFERENCE_TO_VIDEO_MAX_IMAGES;
  }
  return REFERENCE_TO_VIDEO_MAX_IMAGES;
}

export function videoComposerUsesVeo31(composerModelId: string): boolean {
  return isVeo31ComposerId(composerModelId);
}

export function veo31ReferenceDurationSeconds(): number {
  return VEO_31_REFERENCE_DURATION_SECONDS;
}

export function veo31DurationOptionsForTab(actionTab: string): number[] {
  if (actionTab === "Reference to Video") {
    return [VEO_31_REFERENCE_DURATION_SECONDS];
  }
  return [...VEO_31_DURATION_OPTIONS];
}

export function veo31AspectOptionsForUi(): readonly string[] {
  return VEO_31_ASPECT_OPTIONS;
}

export function normalizeVeo31ComposerSettings(input: {
  timeSeconds: number;
  aspect: string;
  resolution: string;
  actionTab: string;
}): { timeSeconds: number; aspect: string; resolution: string } {
  let resolution = input.resolution;
  if (resolution === "480p") resolution = "720p";
  const aspect = veo31AspectFromUi(input.aspect);
  const timeSeconds =
    input.actionTab === "Reference to Video"
      ? VEO_31_REFERENCE_DURATION_SECONDS
      : normalizeVeo31DurationSeconds(input.timeSeconds, resolution);
  return { timeSeconds, aspect, resolution };
}

export function happyHorseVideoEditSupportsReferenceImages(
  composerModelId: string,
  actionTab: string
): boolean {
  return actionTab === "Video to Video" && isHappyHorseComposerId(composerModelId);
}

export function happyHorseVideoEditMaxImages(): number {
  return HAPPYHORSE_VIDEO_EDIT_MAX_IMAGES;
}

export function wan27VideoEditSupportsReferenceImages(
  composerModelId: string,
  actionTab: string
): boolean {
  return actionTab === "Video to Video" && isWan27ComposerId(composerModelId);
}

export function wan27VideoEditMaxImages(): number {
  return WAN_27_VIDEO_EDIT_MAX_IMAGES;
}

export function wan27ReferenceDurationOptionsForTab(actionTab: string): number[] {
  return [...wan27DurationOptionsForTab(actionTab)];
}

export const MODE_DROPUP_OPTIONS = [
  "Multi Reference",
  "Extend",
  "First and Last Frames",
  "Multi Frame",
  "UGC",
  "Audio to Video",
  "Voice Clone"
] as const;

export const TIME_SECONDS_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

export const ASPECT_STEP_OPTIONS = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;

export const HAPPYHORSE_DURATION_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

export const WAN27_DURATION_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

export {
  GEMINI_OMNI_FLASH_DURATION_OPTIONS,
  GEMINI_OMNI_FLASH_I2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_MAX_IMAGES,
  GEMINI_OMNI_FLASH_REFERENCE_DURATION_OPTIONS,
  GEMINI_OMNI_FLASH_REFERENCE_MAX_VIDEOS,
  GEMINI_OMNI_FLASH_RESOLUTION_OPTIONS,
  GEMINI_OMNI_FLASH_R2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_T2V_COMPOSER_ID,
  geminiOmniFlashAspectFromUi,
  geminiOmniFlashComposerSupportsAction,
  isGeminiOmniFlashComposerId,
  normalizeGeminiOmniFlashDurationSeconds,
  normalizeGeminiOmniFlashReferenceDurationSeconds
};

export {
  GROK_IMAGINE_VIDEO_ASPECT_OPTIONS,
  GROK_IMAGINE_VIDEO_DURATION_OPTIONS,
  GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_MAX_REFERENCE_IMAGES,
  GROK_IMAGINE_VIDEO_REFERENCE_DURATION_OPTIONS,
  GROK_IMAGINE_VIDEO_RESOLUTION_OPTIONS,
  GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID,
  grokImagineVideoAspectFromUi,
  grokImagineVideoComposerSupportsAction,
  isGrokImagineVideoComposerId,
  normalizeGrokImagineVideoDurationSeconds,
  normalizeGrokImagineVideoReferenceDurationSeconds
};

export function videoComposerUsesHappyHorse(composerModelId: string): boolean {
  return isHappyHorseComposerId(composerModelId);
}

export function videoComposerUsesHailuo(composerModelId: string): boolean {
  return isHailuo23ComposerId(composerModelId);
}

export const HAILUO_23_DURATION_OPTIONS = [...HAILUO_23_I2V_DURATION_OPTIONS] as const;

export {
  HAILUO_23_COMPOSER_ID,
  HAILUO_23_T2V_DURATION_SECONDS,
  isHailuo23ComposerId,
  normalizeHailuo23I2vDurationSeconds
};

export function videoComposerUsesWan27(composerModelId: string): boolean {
  return isWan27ComposerId(composerModelId);
}

export {
  isWan26ComposerId,
  wan26ComposerSupportsShotType,
  wan26DurationOptionsForTab,
  normalizeWan26DurationSeconds,
  WAN_26_DURATION_OPTIONS,
  WAN_26_V2V_DURATION_OPTIONS,
  type Wan26ShotType
} from "@/lib/atlas-wan-26-video";
export {
  isKling30ProComposerId,
  KLING_V3_BILLING_RESOLUTION,
  kling30ProComposerSupportsEndFrame,
  kling30ProComposerSupportsShotType,
  klingV3AspectOptionsForUi,
  klingV3DurationOptionsForUi,
  klingV3AspectFromUi,
  normalizeKlingV3DurationSeconds,
  type KlingV3ShotMode
} from "@/lib/atlas-kling-v3-video";

export function videoComposerUses720p1080pOnly(composerModelId: string): boolean {
  return (
    videoComposerUsesHappyHorse(composerModelId) ||
    videoComposerUsesWan27(composerModelId) ||
    videoComposerUsesVeo31(composerModelId)
  );
}

/** Seedance R2V is trained for 720p+; hide 480p on Reference to Video. */
export function referenceToVideoHide480p(composerModelId: string): boolean {
  return composerModelId === "seedance-2" || videoComposerUses720p1080pOnly(composerModelId);
}

export function isSeedance20ComposerId(composerModelId: string): boolean {
  return composerModelId === "seedance-2";
}

export function videoComposerSupports4k(composerModelId: string): boolean {
  return (
    isGeminiOmniFlashComposerId(composerModelId) ||
    isSeedance20ComposerId(composerModelId) ||
    isVeo31ComposerId(composerModelId)
  );
}

export const VEO_31_RESOLUTION_OPTIONS = [
  { id: "4k" as const, label: "4K", newBadge: true },
  { id: "1080p" as const, label: "1080p", newBadge: false },
  { id: "720p" as const, label: "720p", newBadge: false }
] as const;

export const SEEDANCE_20_RESOLUTION_OPTIONS = [
  { id: "4k" as const, label: "4K", newBadge: true },
  { id: "1080p" as const, label: "1080p", newBadge: false },
  { id: "720p" as const, label: "720p", newBadge: false },
  { id: "480p" as const, label: "480p", newBadge: false }
] as const;

export function seedance20ResolutionOptionsForTab(
  actionTab: string,
  speedTier: "standard" | "fast" = "standard"
): typeof SEEDANCE_20_RESOLUTION_OPTIONS[number][] {
  let options = [...SEEDANCE_20_RESOLUTION_OPTIONS];
  // Seedance R2V is trained for 720p+; hide 480p.
  if (actionTab === "Reference to Video") {
    options = options.filter((r) => r.id !== "480p");
  }
  // Atlas Fast R2V has no native 1080p / 4k (only 720p + SR tiers).
  if (speedTier === "fast") {
    options = options.filter((r) => r.id === "720p" || r.id === "480p");
  }
  return options;
}

export const RESOLUTION_STEP_OPTIONS = [
  { id: "1080p" as const, label: "1080p", newBadge: true },
  { id: "720p" as const, label: "720p", newBadge: false },
  { id: "480p" as const, label: "480p", newBadge: false }
];

export const STANDARD_DURATION_OPTIONS = ["Standard", "Fast"] as const;