/** Per-model Image-to-Image upload slots (Atlas APIs differ — not all use Reference + Style). */
export type ImageI2iUploadSlot = {
  label: string;
  hint?: string;
  optional?: boolean;
};

const GPT_STYLE_SLOTS: ImageI2iUploadSlot[] = [
  { label: "Reference", hint: "Subject / face to keep" },
  { label: "Style", hint: "Look, color, mood", optional: true }
];

const SOURCE_ONLY: ImageI2iUploadSlot[] = [
  { label: "Source image", hint: "Photo to edit or transform" }
];

const SOURCE_PLUS_REF: ImageI2iUploadSlot[] = [
  { label: "Source image", hint: "Main photo" },
  { label: "Reference", hint: "Optional guide", optional: true }
];

const MULTI_REF: ImageI2iUploadSlot[] = [
  { label: "Reference", hint: "Main subject" },
  { label: "Reference 2", hint: "Optional second image", optional: true }
];

const FLUX_KONTEXT_SLOTS: ImageI2iUploadSlot[] = [
  { label: "Source image", hint: "Main image to transform" },
  { label: "Context", hint: "Optional extra reference", optional: true }
];

/** Models that use a dedicated style / mood plate (GPT Image 2 edit). */
export function imageI2iUsesStyleSlot(modelId: string): boolean {
  return modelId === "gpt-image-2";
}

export function getImageI2iUploadSlots(modelId: string): ImageI2iUploadSlot[] {
  switch (modelId) {
    case "gpt-image-2":
      return GPT_STYLE_SLOTS;
    case "grok-imagine":
      return SOURCE_ONLY;
    case "flux-kontext-dev":
    case "flux-kontext-dev-lora":
      return FLUX_KONTEXT_SLOTS;
    case "seedream-5":
      return SOURCE_PLUS_REF;
    default:
      return MULTI_REF;
  }
}

/** Max upload tiles shown in the bottom bar (capped by Atlas model limit elsewhere). */
export function getImageI2iSlotCount(modelId: string): number {
  return getImageI2iUploadSlots(modelId).length;
}
