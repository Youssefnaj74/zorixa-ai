import { IMAGE_CAMERA_STYLES } from "@/components/image/image-bottom-bar-constants";

export type ImageCameraStyle = (typeof IMAGE_CAMERA_STYLES)[number];

const CAMERA_STYLE_SUFFIX: Record<Exclude<ImageCameraStyle, "None">, string> = {
  "iPhone Selfie":
    "POV front-facing iPhone selfie, arm-length framing, slight wide-angle lens distortion, candid smartphone photo.",
  "Mirror Selfie":
    "POV mirror selfie, phone visible in the mirror reflection, casual indoor mirror shot, smartphone photo.",
  "Top Down View":
    "Top-down overhead camera angle, bird's-eye view looking straight down at the subject.",
  "Full Bodyshot":
    "Full body shot, head to toe in frame, full-length portrait, entire figure visible."
};

export function isImageCameraStyle(value: string): value is ImageCameraStyle {
  return (IMAGE_CAMERA_STYLES as readonly string[]).includes(value);
}

/** Appends camera/framing hints to the user prompt (Atlas has no native camera param). */
export function applyImageCameraStyle(prompt: string, cameraStyle: string): string {
  const base = prompt.trim();
  if (!base || cameraStyle === "None" || !isImageCameraStyle(cameraStyle)) return base;
  const suffix = CAMERA_STYLE_SUFFIX[cameraStyle];
  if (base.toLowerCase().includes(suffix.slice(0, 24).toLowerCase())) return base;
  return `${base} ${suffix}`;
}
