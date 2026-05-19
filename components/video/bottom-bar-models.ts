import type { BadgeVariant } from "@/components/ui/Badge";

import { KLING_26_MOTION_COMPOSER_ID } from "@/lib/atlas-kling-motion-control";
import {
  videoComposerSupportsMotionControl,
  videoComposerSupportsWanVideoToVideo
} from "@/lib/atlas-video-model-ids";

/** Use this for Kling 3.0 Pro in UI state and API gating (must match BOTTOM_BAR_MODELS id). */
export const KLING_30_PRO_MODEL_ID = "kling-3-pro" as const;

export { KLING_26_MOTION_COMPOSER_ID };

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
  { id: "hailuo-2-3", label: "Hailuo 2.3", badge: "newTeal" },
  { id: "google-veo-3-1", label: "Google Veo 3.1", badge: "newTeal" }
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

/** Multimodal reference-to-video (3–9 images) — Seedance 2.0 on Atlas only. */
export function videoComposerSupportsReferenceToVideo(composerModelId: string): boolean {
  return composerModelId === "seedance-2";
}

/** Kling 2.6 motion-transfer — picker under Video to Video tab. */
export function videoComposerSupportsMotionControlTab(composerModelId: string): boolean {
  return videoComposerSupportsMotionControl(composerModelId);
}

/** Wan 2.6 video-to-video — picker under Video to Video tab. */
export function videoComposerSupportsVideoEditTab(composerModelId: string): boolean {
  return videoComposerSupportsWanVideoToVideo(composerModelId);
}

export function videoToVideoTabUsesKlingMotion(composerModelId: string): boolean {
  return videoComposerSupportsMotionControlTab(composerModelId);
}

export function videoToVideoTabUsesWanV2v(composerModelId: string): boolean {
  return videoComposerSupportsVideoEditTab(composerModelId);
}

export function bottomBarModelsForActionTab(actionTab: string): BottomBarModel[] {
  if (actionTab === "Reference to Video") {
    return BOTTOM_BAR_MODELS.filter((m) => videoComposerSupportsReferenceToVideo(m.id));
  }
  if (actionTab === "Video to Video") {
    return BOTTOM_BAR_MODELS.filter(
      (m) => videoComposerSupportsVideoEditTab(m.id) || videoComposerSupportsMotionControlTab(m.id)
    );
  }
  return BOTTOM_BAR_MODELS.filter((m) => !videoComposerSupportsMotionControlTab(m.id));
}

export const REFERENCE_TO_VIDEO_MAX_IMAGES = 4;

export const MODE_DROPUP_OPTIONS = [
  "Multi Reference",
  "Extend",
  "First and Last Frames",
  "Multi Frame",
  "UGC",
  "Lipsyncing",
  "Voice Clone"
] as const;

export const TIME_SECONDS_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

/** Kling 2.6 motion control — Atlas max duration depends on character_orientation. */
export const MOTION_CONTROL_DURATION_OPTIONS = [5, 10, 15, 30] as const;

export const ASPECT_STEP_OPTIONS = ["16:9", "9:16", "1:1", "4:3"] as const;

export const RESOLUTION_STEP_OPTIONS = [
  { id: "1080p" as const, label: "1080p", newBadge: true },
  { id: "720p" as const, label: "720p", newBadge: false },
  { id: "480p" as const, label: "480p", newBadge: false }
];

export const STANDARD_DURATION_OPTIONS = ["Standard", "Fast"] as const;
