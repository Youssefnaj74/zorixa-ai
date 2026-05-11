import type { BadgeVariant } from "@/components/ui/Badge";

/** Use this for Kling 3.0 Pro in UI state and API gating (must match BOTTOM_BAR_MODELS id). */
export const KLING_30_PRO_MODEL_ID = "kling-3-pro" as const;

/** Bottom bar MODEL dropup — Atlas-backed video models only. */
export type BottomBarModel = {
  id: string;
  label: string;
  badge?: BadgeVariant;
  locked?: boolean;
};

export const BOTTOM_BAR_MODELS: BottomBarModel[] = [
  { id: KLING_30_PRO_MODEL_ID, label: "Kling 3.0 Pro", badge: "pro" },
  { id: "seedance-2", label: "Seedance 2.0", badge: "newTeal" },
  { id: "seedance-1-5", label: "Seedance 1.5", badge: "newTeal" },
  { id: "wan-2-6", label: "Wan 2.6" },
  { id: "hailuo-2-3", label: "Hailuo 2.3", badge: "newTeal" },
  { id: "google-veo-3-1", label: "Google Veo 3.1", badge: "newTeal" }
];

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

export const ASPECT_STEP_OPTIONS = ["16:9", "9:16", "1:1", "4:3"] as const;

export const RESOLUTION_STEP_OPTIONS = [
  { id: "1080p" as const, label: "1080p", newBadge: true },
  { id: "720p" as const, label: "720p", newBadge: false },
  { id: "480p" as const, label: "480p", newBadge: false }
];

export const STANDARD_DURATION_OPTIONS = ["Standard", "Fast"] as const;
