import type { BadgeVariant } from "@/components/ui/Badge";

export type VideoModelOption = {
  id: string;
  label: string;
  badge?: BadgeVariant;
  locked?: boolean;
};

/** Order matches product spec; default selection: Seedream 5 Lite */
export const VIDEO_MODELS: VideoModelOption[] = [
  { id: "seedream-5-lite", label: "Seedream 5 Lite", badge: "fullAccess" },
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
