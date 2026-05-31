/**
 * Seedance on Atlas Cloud — width/height + prompt hints for aspect.
 *
 * Observed: UI 9:16 with width&lt;height often returns landscape files (856×480).
 * Sending swapped pixels (width&gt;height in JSON) may correct Atlas orientation.
 */

const SEEDANCE_PRESETS: Record<string, Record<string, { width: number; height: number }>> = {
  "9:16": {
    "480p": { width: 480, height: 864 },
    "720p": { width: 720, height: 1280 },
    "1080p": { width: 1080, height: 1920 }
  },
  "16:9": {
    "480p": { width: 864, height: 480 },
    "720p": { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 }
  },
  "1:1": {
    "480p": { width: 480, height: 480 },
    "720p": { width: 720, height: 720 },
    "1080p": { width: 1080, height: 1080 }
  },
  "4:3": {
    "480p": { width: 640, height: 480 },
    "720p": { width: 960, height: 720 },
    "1080p": { width: 1440, height: 1080 }
  },
  "3:4": {
    "480p": { width: 480, height: 640 },
    "720p": { width: 720, height: 960 },
    "750p": { width: 752, height: 1000 },
    "1080p": { width: 1080, height: 1440 }
  }
};

function snapVideoDimension(n: number): number {
  return Math.max(64, Math.round(n / 8) * 8);
}

export function seedancePresetDimensions(
  aspectRatio: string,
  resolution: string
): { width: number; height: number } {
  const row = SEEDANCE_PRESETS[aspectRatio] ?? SEEDANCE_PRESETS["9:16"];
  const preset = row[resolution] ?? row["720p"];
  return {
    width: snapVideoDimension(preset.width),
    height: snapVideoDimension(preset.height)
  };
}

export type SeedanceAtlasRouteAction = "text" | "image";

/**
 * Atlas Seedance T2V: swap W/H in the JSON body so output file matches UI aspect.
 * (Request 856×480 when user picks 9:16 → file often comes back 480×856.)
 *
 * I2V must use logical portrait/landscape pixels — swapped sizes often make Atlas fail (400).
 */
export function seedanceAtlasRequestDimensions(
  aspectRatio: string,
  resolution: string,
  routeAction: SeedanceAtlasRouteAction = "text"
): { width: number; height: number; logical: { width: number; height: number } } {
  const logical = seedancePresetDimensions(aspectRatio, resolution);

  if (aspectRatio === "9:16" && routeAction === "text") {
    return {
      width: logical.height,
      height: logical.width,
      logical
    };
  }

  return { ...logical, logical };
}

const ASPECT_HINT: Record<string, string> = {
  "9:16": "Vertical 9:16 portrait video, tall mobile frame, not widescreen.",
  "16:9": "Widescreen 16:9 landscape cinematic format.",
  "1:1": "Square 1:1 video format.",
  "4:3": "4:3 aspect ratio video.",
  "3:4": "Vertical 3:4 portrait video, tall mobile frame."
};

/** Strengthen aspect in prompt when Seedance would otherwise go adaptive → 16:9. */
export function augmentSeedancePromptForAspect(prompt: string, aspectRatio: string): string {
  const hint = ASPECT_HINT[aspectRatio];
  if (!hint) return prompt;
  const lower = prompt.toLowerCase();
  if (lower.includes("9:16") || lower.includes("9/16") || lower.includes("portrait")) {
    if (aspectRatio === "9:16") return prompt;
  }
  if (lower.includes("16:9") || lower.includes("16/9") || lower.includes("landscape")) {
    if (aspectRatio === "16:9") return prompt;
  }
  return `${prompt.trim()}\n\n${hint}`;
}
