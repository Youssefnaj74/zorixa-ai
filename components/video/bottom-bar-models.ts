import type { BadgeVariant } from "@/components/ui/Badge";

import {
  AUDIO_TO_VIDEO_COMPOSER_IDS,
  INFINITETALK_COMPOSER_ID,
  VEED_FABRIC_1_COMPOSER_ID,
  VEED_FABRIC_1_FAST_COMPOSER_ID
} from "@/lib/atlas-audio-to-video";
import { KLING_26_MOTION_COMPOSER_ID } from "@/lib/atlas-kling-motion-control";
import { HAPPYHORSE_1_COMPOSER_ID, isHappyHorseComposerId } from "@/lib/atlas-happyhorse-video";
import { WAN_27_COMPOSER_ID, isWan27ComposerId } from "@/lib/atlas-wan-27-video";
import {
  WAN_22_CHARACTER_SWAP_COMPOSER_ID,
  videoComposerSupportsWanCharacterSwap
} from "@/lib/atlas-wan-character-swap";
import {
  videoComposerSupportsHappyHorseReference,
  videoComposerSupportsHappyHorseVideoEdit,
  videoComposerSupportsMotionControl,
  videoComposerSupportsViduStartEnd,
  videoComposerSupportsWan27Reference,
  videoComposerSupportsWan27VideoEdit,
  videoComposerSupportsWanVideoToVideo
} from "@/lib/atlas-video-model-ids";
import { VIDU_Q3_COMPOSER_ID, VIDU_Q3_PRO_COMPOSER_ID } from "@/lib/atlas-vidu-video";

/** Use this for Kling 3.0 Pro in UI state and API gating (must match BOTTOM_BAR_MODELS id). */
export const KLING_30_PRO_MODEL_ID = "kling-3-pro" as const;

export { KLING_26_MOTION_COMPOSER_ID };
export { HAPPYHORSE_1_COMPOSER_ID };
export { WAN_27_COMPOSER_ID };
export { WAN_22_CHARACTER_SWAP_COMPOSER_ID };
export { VIDU_Q3_COMPOSER_ID, VIDU_Q3_PRO_COMPOSER_ID };

/** Bottom bar MODEL dropup — Atlas-backed video models only. */
export type BottomBarModel = {
  id: string;
  label: string;
  badge?: BadgeVariant;
  locked?: boolean;
};

export const BOTTOM_BAR_MODELS: BottomBarModel[] = [
  { id: KLING_30_PRO_MODEL_ID, label: "Kling 3.0 Pro", badge: "pro" },
  { id: KLING_26_MOTION_COMPOSER_ID, label: "Kling 2.6 Motion", badge: "pro" },
  { id: "seedance-2", label: "Seedance 2.0", badge: "newTeal" },
  { id: "seedance-1-5", label: "Seedance 1.5 Pro", badge: "pro" },
  { id: "wan-2-6", label: "Wan 2.6" },
  { id: WAN_22_CHARACTER_SWAP_COMPOSER_ID, label: "Wan 2.2 Character Swap", badge: "newTeal" },
  { id: HAPPYHORSE_1_COMPOSER_ID, label: "HappyHorse 1.0", badge: "newTeal" },
  { id: "hailuo-2-3", label: "Hailuo 2.3", badge: "newTeal" },
  { id: "google-veo-3-1", label: "Google Veo 3.1", badge: "newTeal" },
  { id: VIDU_Q3_COMPOSER_ID, label: "Vidu Q3", badge: "newTeal" },
  { id: VIDU_Q3_PRO_COMPOSER_ID, label: "Vidu Q3-Pro", badge: "pro" }
];

export const AUDIO_TO_VIDEO_BOTTOM_BAR_MODELS: BottomBarModel[] = [
  { id: INFINITETALK_COMPOSER_ID, label: "InfiniteTalk" },
  { id: VEED_FABRIC_1_COMPOSER_ID, label: "VEED Fabric 1.0", badge: "newTeal" },
  { id: VEED_FABRIC_1_FAST_COMPOSER_ID, label: "VEED Fabric 1.0 Fast", badge: "newTeal" }
];

const TEXT_TO_VIDEO_PROMPT_ONLY_IDS = new Set(BOTTOM_BAR_MODELS.map((m) => m.id));

/** Full-width prompt row (no Products slots) — Text to Video or Reference uses ref grid separately. */
export function videoComposerUsesTextOnlyLayout(
  composerModelId: string,
  actionTab: string
): boolean {
  return (
    (actionTab === "Text to Video" && TEXT_TO_VIDEO_PROMPT_ONLY_IDS.has(composerModelId)) ||
    actionTab === "Reference to Video"
  );
}

/** Seedance 2.0 / 1.5 I2V on Atlas accept optional `last_image` (end frame). */
export function videoComposerSupportsEndFrame(composerModelId: string): boolean {
  return composerModelId === "seedance-2" || composerModelId === "seedance-1-5";
}

/** Multimodal reference-to-video — Seedance 2.0 + Vidu Q3 (Atlas, not Q3-Pro). */
export function videoComposerSupportsReferenceToVideo(composerModelId: string): boolean {
  return (
    composerModelId === "seedance-2" ||
    composerModelId === VIDU_Q3_COMPOSER_ID ||
    videoComposerSupportsHappyHorseReference(composerModelId) ||
    videoComposerSupportsWan27Reference(composerModelId)
  );
}

/** Kling 2.6 motion-transfer — Character Swap tab only. */
export function videoComposerSupportsMotionControlTab(composerModelId: string): boolean {
  return videoComposerSupportsMotionControl(composerModelId);
}

/** Wan 2.2 animate-mix — Character Swap tab only. */
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

/** Wan / HappyHorse video-edit — picker under Video to Video tab. */
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

/** Image + reference video layout (Kling motion or Wan character swap). */
export function characterSwapTabUsesDualAssetPipeline(composerModelId: string): boolean {
  return characterSwapTabSupportsModel(composerModelId);
}

/** @deprecated Use characterSwapTabUsesDualAssetPipeline on Character Swap tab. */
export function videoToVideoTabUsesDualAssetPipeline(composerModelId: string): boolean {
  return characterSwapTabUsesDualAssetPipeline(composerModelId);
}

export function videoToVideoTabUsesWanV2v(composerModelId: string): boolean {
  return videoComposerSupportsVideoEditTab(composerModelId);
}

export function videoToVideoTabUsesViduStartEnd(composerModelId: string): boolean {
  return videoComposerSupportsViduStartEnd(composerModelId);
}

/** Dual-asset V2V — hide aspect, resolution, mode. */
export function videoComposerUsesKlingMotionBarLayout(composerModelId: string, actionTab: string): boolean {
  return actionTab === "Video to Video" && videoToVideoTabUsesDualAssetPipeline(composerModelId);
}

/** UI label for Standard/Fast dropup when tier maps to Atlas Pro/Std. */
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
  if (actionTab === "Character Swap") {
    return CHARACTER_SWAP_BOTTOM_BAR_MODELS;
  }
  if (actionTab === "Reference to Video") {
    return BOTTOM_BAR_MODELS.filter((m) => videoComposerSupportsReferenceToVideo(m.id));
  }
  if (actionTab === "Video to Video") {
    return BOTTOM_BAR_MODELS.filter(
      (m) => videoComposerSupportsVideoEditTab(m.id) || videoComposerSupportsViduStartEnd(m.id)
    );
  }
  return BOTTOM_BAR_MODELS.filter(
    (m) =>
      !videoComposerSupportsMotionControlTab(m.id) &&
      !videoComposerSupportsWanCharacterSwapTab(m.id)
  );
}

export function videoComposerUsesAudioToVideoBarLayout(
  composerModelId: string,
  actionTab: string
): boolean {
  return actionTab === "Audio to Video";
}

export const REFERENCE_TO_VIDEO_MAX_IMAGES = 4;

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

/** Kling 2.6 motion control — Atlas max duration depends on character_orientation. */
export const MOTION_CONTROL_DURATION_OPTIONS = [5, 10, 15, 30] as const;

export const ASPECT_STEP_OPTIONS = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;

export const HAPPYHORSE_DURATION_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

/** Wan 2.7 — Atlas allows 2–15s clips. */
export const WAN27_DURATION_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

export function videoComposerUsesHappyHorse(composerModelId: string): boolean {
  return isHappyHorseComposerId(composerModelId);
}

export function videoComposerUsesWan27(composerModelId: string): boolean {
  return isWan27ComposerId(composerModelId);
}

/** HappyHorse / Wan 2.7 — 720p+1080p only (Atlas 720P/1080P). */
export function videoComposerUses720p1080pOnly(composerModelId: string): boolean {
  return videoComposerUsesHappyHorse(composerModelId) || videoComposerUsesWan27(composerModelId);
}

export const RESOLUTION_STEP_OPTIONS = [
  { id: "1080p" as const, label: "1080p", newBadge: true },
  { id: "720p" as const, label: "720p", newBadge: false },
  { id: "480p" as const, label: "480p", newBadge: false }
];

export const STANDARD_DURATION_OPTIONS = ["Standard", "Fast"] as const;
