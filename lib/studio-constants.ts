import type { LucideIcon } from "lucide-react";
import { Monitor, Smartphone, Square } from "lucide-react";

export type AspectRatioId = "9:16" | "1:1" | "16:9";

export type EnhanceModelId = "real_esrgan" | "codeformer" | "rembg" | "sdxl";

export type VideoModelId = "default" | "kling" | "luma";

export type UpscaleTier = "2x" | "4x" | "8x";

export const ASPECT_OPTIONS: {
  id: AspectRatioId;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  { id: "9:16", label: "9:16", hint: "TikTok · Reels", icon: Smartphone },
  { id: "1:1", label: "1:1", hint: "Instagram", icon: Square },
  { id: "16:9", label: "16:9", hint: "YouTube", icon: Monitor }
];

export const ENHANCE_MODELS: {
  id: EnhanceModelId;
  name: string;
  description: string;
  badge?: string;
}[] = [
  {
    id: "real_esrgan",
    name: "Real-ESRGAN",
    description: "Sharp upscaling for photos & textures.",
    badge: "Upscale"
  },
  {
    id: "codeformer",
    name: "CodeFormer",
    description: "Face & detail restoration, denoise.",
    badge: "Restore"
  },
  {
    id: "rembg",
    name: "Remove BG",
    description: "Clean subject cutouts on any backdrop.",
    badge: "Matte"
  },
  {
    id: "sdxl",
    name: "Stable Diffusion XL",
    description: "Creative edits & restyle from your prompt.",
    badge: "Creative"
  }
];

export const VIDEO_MODELS: {
  id: VideoModelId;
  name: string;
  description: string;
}[] = [
  {
    id: "default",
    name: "Studio default",
    description: "Uses your configured Replicate video model."
  },
  {
    id: "kling",
    name: "Kling-style",
    description: "Set REPLICATE_MODEL_VIDEO_KLING for a dedicated slug."
  },
  {
    id: "luma",
    name: "Luma-style",
    description: "Set REPLICATE_MODEL_VIDEO_LUMA for a dedicated slug."
  }
];

export const UPSCALE_OPTIONS: { id: UpscaleTier; label: string; sub: string }[] = [
  { id: "2x", label: "2×", sub: "Fast" },
  { id: "4x", label: "4×", sub: "Balanced" },
  { id: "8x", label: "8×", sub: "Max detail" }
];
