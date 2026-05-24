import { ATLAS_IMAGE_MODEL_MAP } from "@/lib/atlas-image-model-ids";
import { ATLAS_VIDEO_MODEL_MAP } from "@/lib/atlas-video-model-ids";
import { isAudioToVideoComposerId } from "@/lib/atlas-audio-to-video";

export type McpModelEntry = {
  id: string;
  label: string;
  kind: "image" | "video";
  modes: string[];
};

const IMAGE_LABELS: Record<string, string> = {
  "gpt-image-2": "GPT Image 2",
  "nano-banana-2": "Nano Banana 2",
  "nano-banana-pro": "Nano Banana Pro",
  zorixa: "Zorixa Image",
  "seedream-5": "Seedream 5 Lite",
  "grok-imagine": "Grok Imagine",
  "flux-dev": "Flux Dev",
  "flux-schnell": "Flux Schnell",
  "flux-dev-lora": "Flux Dev LoRA",
  "flux-kontext-dev": "Flux Kontext Dev",
  "flux-kontext-dev-lora": "Flux Kontext Dev LoRA",
  "wan-image-2-7": "Wan 2.7 Image",
  "wan-image-2-7-pro": "Wan 2.7 Pro Image",
  "wan-image-2-6": "Wan 2.6 Image"
};

const VIDEO_LABELS: Record<string, string> = {
  "kling-3-pro": "Kling 3.0 Pro",
  "kling-2-6-motion": "Kling 2.6 Motion",
  "seedance-2": "Seedance 2.0",
  "seedance-1-5": "Seedance 1.5 Pro",
  "wan-2-6": "Wan 2.6",
  "wan-2-7": "Wan 2.7",
  "wan-2-2-character-swap": "Wan 2.2 Character Swap",
  "happyhorse-1": "HappyHorse 1.0",
  "hailuo-2-3": "Hailuo 2.3",
  "google-veo-3-1": "Google Veo 3.1",
  "vidu-q3": "Vidu Q3",
  "vidu-q3-pro": "Vidu Q3-Pro"
};

export function buildMcpModelsCatalog(): McpModelEntry[] {
  const images: McpModelEntry[] = Object.keys(ATLAS_IMAGE_MODEL_MAP).map((id) => ({
    id,
    label: IMAGE_LABELS[id] ?? id,
    kind: "image" as const,
    modes: ["text-to-image", "image-edit"]
  }));

  const videos: McpModelEntry[] = Object.keys(ATLAS_VIDEO_MODEL_MAP)
    .filter((id) => !isAudioToVideoComposerId(id))
    .map((id) => ({
      id,
      label: VIDEO_LABELS[id] ?? id,
      kind: "video" as const,
      modes: [
        "text-to-video",
        "image-to-video",
        "reference-to-video",
        "video-to-video",
        "character-swap"
      ]
    }));

  return [...images, ...videos];
}
