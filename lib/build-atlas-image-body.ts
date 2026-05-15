/**
 * Builds Atlas `generateImage` request bodies per model family.
 * @see https://www.atlascloud.ai/models
 */

export type BuildAtlasImageBodyInput = {
  model: string;
  prompt: string;
  isEdit: boolean;
  imageUrls: string[];
  aspectRatio: string | null;
  resolution: string;
  numImages: number;
  negativePrompt: string;
};

function isQwenImageAtlasModel(model: string): boolean {
  return model.includes("qwen-image");
}

function isGptImage2AtlasModel(model: string): boolean {
  return model.includes("gpt-image-2");
}

/** Qwen Image uses `size` as `width*height` (512–2048). */
export function qwenSizeFromAspectAndResolution(
  aspectRatio: string | null,
  resolution: string
): string {
  const s = resolutionShortSidePx(resolution);
  const aspect = aspectRatio ?? "1:1";
  let width: number;
  let height: number;
  switch (aspect) {
    case "16:9":
      height = s;
      width = Math.round((s * 16) / 9);
      break;
    case "9:16":
      width = s;
      height = Math.round((s * 16) / 9);
      break;
    case "4:3":
      height = s;
      width = Math.round((s * 4) / 3);
      break;
    case "3:4":
      width = s;
      height = Math.round((s * 4) / 3);
      break;
    case "1:1":
    default:
      width = s;
      height = s;
      break;
  }
  width = Math.min(2048, Math.max(512, width));
  height = Math.min(2048, Math.max(512, height));
  return `${width}*${height}`;
}

function resolutionShortSidePx(resolution: string): number {
  switch (resolution.trim().toUpperCase()) {
    case "4K":
      return 2048;
    case "2K":
      return 1536;
    case "1K":
    default:
      return 1024;
  }
}

/**
 * GPT Image 2 on Atlas only accepts these three `size` strings (never send raw width/height only).
 *
 * Explicit mapping for studio ratios:
 *
 * | Aspect | Atlas `size` (pixels W×H) |
 * |--------|-------------------------|
 * | 1:1    | `1024x1024`             |
 * | 4:3    | `1536x1024`             |
 * | 3:2    | `1536x1024`             |
 * | 3:4    | `1024x1536`             |
 * | 2:3    | `1024x1536`             |
 *
 * Other presets share the same wide/tall canvases (geometry is snapped — OpenAI fixed trio).
 */
function sanitizeAspectRatioLabel(raw: string | null): string | null {
  if (raw == null) return null;
  const v = raw.trim().replace(/\uFF1A/g, ":").replace(/\s+/g, "");
  return v.length > 0 ? v : null;
}

function gptImage2CanvasSize(aspectRatio: string | null): "1024x1024" | "1536x1024" | "1024x1536" {
  const label = sanitizeAspectRatioLabel(aspectRatio);
  switch (label) {
    case "1:1":
      return "1024x1024";

    case "4:3":
      return "1536x1024";
    case "3:2":
      return "1536x1024";

    case "3:4":
      return "1024x1536";
    case "2:3":
      return "1024x1536";

    case "16:9":
    case "21:9":
    case "5:4":
      return "1536x1024";

    case "9:16":
    case "4:5":
      return "1024x1536";

    default:
      return "1024x1024";
  }
}

function resolutionToGptQuality(resolution: string): "low" | "medium" | "high" {
  switch (resolution.trim().toUpperCase()) {
    case "4K":
    case "3K":
      return "high";
    case "2K":
      return "medium";
    case "1K":
    default:
      return "low";
  }
}

function mapResolutionToMediaResolution(resolution: string): string | undefined {
  switch (resolution.trim().toUpperCase()) {
    case "4K":
      return "high";
    case "2K":
      return "medium";
    case "1K":
      return "low";
    default:
      return undefined;
  }
}

/**
 * Atlas `generateImage` for GPT Image 2 expects `size` as a string (`1536x1024`,
 * `1024x1536`, `1024x1024`). Passing only `width`/`height` can be ignored or
 * mis-resolved → wrong orientation (e.g. 16:9 requested → portrait output).
 * @see https://www.atlascloud.ai/blog/guides/gpt-image-2-api-guide
 */
export function gptImage2AtlasSize(aspectRatio: string | null): string {
  return gptImage2CanvasSize(aspectRatio);
}

export function buildAtlasImageBody(input: BuildAtlasImageBodyInput): Record<string, unknown> {
  const { model, prompt, isEdit, imageUrls, aspectRatio, resolution, numImages, negativePrompt } =
    input;

  if (isQwenImageAtlasModel(model)) {
    const body: Record<string, unknown> = { model, prompt };
    body.size = qwenSizeFromAspectAndResolution(aspectRatio, resolution || "1K");
    if (isEdit && imageUrls[0]) {
      body.image = imageUrls[0];
    }
    return body;
  }

  if (isGptImage2AtlasModel(model)) {
    const body: Record<string, unknown> = {
      model,
      prompt,
      size: gptImage2AtlasSize(aspectRatio),
      quality: resolutionToGptQuality(resolution || "1K")
    };
    if (isEdit && imageUrls.length > 0) {
      body.image = imageUrls[0];
      body.images = imageUrls;
    }
    return body;
  }

  const body: Record<string, unknown> = { model, prompt };

  if (negativePrompt) {
    body.negative_prompt = negativePrompt;
  }
  if (aspectRatio) {
    body.aspect_ratio = aspectRatio;
    body.aspectRatio = aspectRatio;
  }
  const size = resolution
    ? qwenSizeFromAspectAndResolution(aspectRatio, resolution)
    : undefined;
  if (size) {
    body.size = size;
  }
  const mediaResolution = resolution ? mapResolutionToMediaResolution(resolution) : undefined;
  if (mediaResolution) {
    body.media_resolution = mediaResolution;
  }
  if (numImages > 1) {
    body.n = numImages;
    body.num_images = numImages;
  }

  if (isEdit) {
    body.images = imageUrls;
    body.image = imageUrls[0];
    body.image_url = imageUrls[0];
  }

  return body;
}

export function atlasGenerateImageErrorMessage(
  json: { data?: { error?: string | null }; message?: string },
  status: number
): string {
  const parts: string[] = [];
  const dataErr = json.data?.error;
  if (typeof dataErr === "string" && dataErr.trim()) parts.push(dataErr.trim());
  if (typeof json.message === "string" && json.message.trim()) parts.push(json.message.trim());
  return parts.length > 0 ? parts.join(" — ") : `Atlas generateImage failed (${status})`;
}
