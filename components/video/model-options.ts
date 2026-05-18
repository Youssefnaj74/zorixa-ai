import type { BadgeVariant } from "@/components/ui/Badge";

import { KLING_30_PRO_MODEL_ID } from "@/components/video/bottom-bar-models";

export type VideoModelOption = {
  id: string;
  label: string;
  badge?: BadgeVariant;
  locked?: boolean;
};

/** Video model list (aligned with bottom bar Atlas models). */
export const VIDEO_MODELS: VideoModelOption[] = [
  { id: KLING_30_PRO_MODEL_ID, label: "Kling 3.0 Pro", badge: "pro" },
  { id: "seedance-2", label: "Seedance 2.0", badge: "newTeal" },
  { id: "seedance-1-5", label: "Seedance 1.5 Pro", badge: "pro" },
  { id: "wan-2-6", label: "Wan 2.6" },
  { id: "hailuo-2-3", label: "Hailuo 2.3", badge: "newTeal" },
  { id: "google-veo-3-1", label: "Google Veo 3.1", badge: "newTeal" }
];

export const TYPE_OPTIONS = [
  "Multi Reference",
  "Extend",
  "First and Last Frames",
  "Multi Frame",
  "UGC",
  "Lipsyncing",
  "Voice Clone"
] as const;

export const FPS_OPTIONS = ["12", "24", "30", "60"] as const;

export const RESOLUTION_OPTIONS = [
  { id: "1080p", label: "1080p", badge: "newTeal" as const },
  { id: "720p", label: "720p" },
  { id: "480p", label: "480p" }
] as const;
