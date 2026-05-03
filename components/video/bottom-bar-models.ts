import type { BadgeVariant } from "@/components/ui/Badge";

/** Bottom bar MODEL dropup — matches product spec (no Seedream row). */
export type BottomBarModel = {
  id: string;
  label: string;
  badge?: BadgeVariant;
  locked?: boolean;
};

export const BOTTOM_BAR_MODELS: BottomBarModel[] = [
  { id: "happy-horse", label: "Happy Horse", badge: "newTeal" },
  { id: "seedance-2", label: "Seedance 2.0", badge: "newTeal" },
  { id: "kling-3-pro", label: "Kling 3.0 Pro", badge: "pro" },
  { id: "enhancor-v4", label: "Enhancor V4", badge: "newTeal" },
  { id: "seedance-1-5", label: "Seedance 1.5", badge: "newTeal" },
  { id: "google-veo", label: "Google VEO 3.1", locked: true },
  { id: "sora-2", label: "Sora 2", locked: true },
  { id: "wan-2-6", label: "Wan 2.6" },
  { id: "grok-imagine", label: "Grok Imagine" }
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
