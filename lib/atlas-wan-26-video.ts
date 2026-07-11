/**
 * Alibaba Wan 2.6 — text / image / video-to-video on Atlas Cloud.
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.6/text-to-video
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.6/image-to-video
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.6/video-to-video
 */

export const WAN_26_COMPOSER_ID = "wan-2-6" as const;

export const WAN_26_SHOT_TYPES = ["single", "multi"] as const;

/** Atlas T2V / I2V — enum 5 | 10 | 15. */
export const WAN_26_DURATION_OPTIONS = [5, 10, 15] as const;

/** Atlas V2V — enum 5 | 10 only. */
export const WAN_26_V2V_DURATION_OPTIONS = [5, 10] as const;

export type Wan26ShotType = (typeof WAN_26_SHOT_TYPES)[number];

export function isWan26ComposerId(id: string): boolean {
  return id === WAN_26_COMPOSER_ID;
}

export function isWan26AtlasModel(model: string): boolean {
  return /alibaba\/wan-2\.6\/(text-to-video|image-to-video|video-to-video)/i.test(model);
}

export function isWan26TextToVideoModel(model: string): boolean {
  return /alibaba\/wan-2\.6\/text-to-video/i.test(model);
}

export function isWan26ImageToVideoModel(model: string): boolean {
  return /alibaba\/wan-2\.6\/image-to-video/i.test(model);
}

export function isWan26VideoEditModel(model: string): boolean {
  return /alibaba\/wan-2\.6\/video-to-video/i.test(model);
}

const WAN_26_SIZE_BY_ASPECT_RES: Record<string, Record<string, string>> = {
  "16:9": { "720p": "1280*720", "1080p": "1920*1080", "480p": "1280*720", "4k": "1920*1080" },
  "9:16": { "720p": "720*1280", "1080p": "1080*1920", "480p": "720*1280", "4k": "1080*1920" },
  "1:1": { "720p": "960*960", "1080p": "1440*1440", "480p": "960*960", "4k": "1440*1440" },
  "4:3": { "720p": "1088*832", "1080p": "1632*1248", "480p": "1088*832", "4k": "1632*1248" },
  "3:4": { "720p": "832*1088", "1080p": "1248*1632", "480p": "832*1088", "4k": "1248*1632" }
};

/** Atlas T2V / V2V `size` field (width*height). */
export function wan26SizeFromAspectResolution(aspectRatio: string, resolution: string): string {
  const aspect = aspectRatio.trim() || "16:9";
  const res = resolution.trim().toLowerCase() || "720p";
  return WAN_26_SIZE_BY_ASPECT_RES[aspect]?.[res] ?? "1280*720";
}

/** Atlas I2V `resolution` enum. */
export function wan26ResolutionFromUi(resolution: string): "720p" | "1080p" {
  const res = resolution.trim().toLowerCase();
  return res === "1080p" || res === "4k" ? "1080p" : "720p";
}

function applyWan26GenerateAudio(
  body: Record<string, unknown>,
  generateAudio: boolean | undefined
): void {
  if (generateAudio === undefined) return;
  body.generate_audio = generateAudio;
}

export function buildWan26TextAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  shotType: Wan26ShotType;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    size: wan26SizeFromAspectResolution(input.aspectRatio, input.resolution),
    duration: snapWan26Duration(input.durationSec, WAN_26_DURATION_OPTIONS),
    enable_prompt_expansion: true
  };
  applyWan26ShotTypeFields(body, input.shotType);
  applyWan26GenerateAudio(body, input.generateAudio);
  return body;
}

export function buildWan26ImageAtlasBody(input: {
  model: string;
  prompt: string;
  resolution: string;
  durationSec: number;
  imageUrl: string;
  audioUrl?: string;
  shotType: Wan26ShotType;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    image: input.imageUrl,
    resolution: wan26ResolutionFromUi(input.resolution),
    duration: snapWan26Duration(input.durationSec, WAN_26_DURATION_OPTIONS),
    enable_prompt_expansion: true
  };
  if (input.audioUrl) body.audio = input.audioUrl;
  applyWan26ShotTypeFields(body, input.shotType);
  applyWan26GenerateAudio(body, input.generateAudio);
  return body;
}

/** Atlas V2V — requires `videos[]` + `size`, not `video_url`. */
export function buildWan26VideoEditAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  videoUrls: string[];
  shotType: Wan26ShotType;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    videos: input.videoUrls.slice(0, 3),
    size: wan26SizeFromAspectResolution(input.aspectRatio, input.resolution),
    duration: snapWan26Duration(input.durationSec, WAN_26_V2V_DURATION_OPTIONS),
    enable_prompt_expansion: true
  };
  applyWan26ShotTypeFields(body, input.shotType);
  applyWan26GenerateAudio(body, input.generateAudio);
  return body;
}

export function normalizeWan26ShotType(raw: unknown): Wan26ShotType {
  if (typeof raw === "string" && raw.trim().toLowerCase() === "multi") {
    return "multi";
  }
  return "single";
}

export function wan26DurationOptionsForTab(actionTab: string): readonly number[] {
  if (actionTab === "Video to Video") return WAN_26_V2V_DURATION_OPTIONS;
  return WAN_26_DURATION_OPTIONS;
}

function snapWan26Duration(raw: number, options: readonly number[]): number {
  if (!Number.isFinite(raw)) return options[0] ?? 5;
  const rounded = Math.round(raw);
  if ((options as readonly number[]).includes(rounded)) return rounded;
  return options.reduce((best, opt) =>
    Math.abs(opt - rounded) < Math.abs(best - rounded) ? opt : best
  );
}

export function normalizeWan26DurationSeconds(raw: number, actionTab: string): number {
  return snapWan26Duration(raw, wan26DurationOptionsForTab(actionTab));
}

/** API route — maps generate action to Wan 2.6 duration enum. */
export function normalizeWan26DurationSecondsForAction(raw: number, action: string): number {
  if (action === "edit") return snapWan26Duration(raw, WAN_26_V2V_DURATION_OPTIONS);
  return snapWan26Duration(raw, WAN_26_DURATION_OPTIONS);
}

/** T2V / I2V / V2V tabs when Wan 2.6 is selected. */
export function wan26ComposerSupportsShotType(
  composerModelId: string,
  actionTab: string
): boolean {
  if (!isWan26ComposerId(composerModelId)) return false;
  return (
    actionTab === "Text to Video" ||
    actionTab === "Image to Video" ||
    actionTab === "Video to Video"
  );
}

/**
 * Atlas `shot_type`: single (default) or multi.
 * Multi-shot requires `enable_prompt_expansion: true` on Atlas.
 */
export function applyWan26ShotTypeFields(
  body: Record<string, unknown>,
  shotType: Wan26ShotType
): void {
  body.shot_type = shotType;
  if (shotType === "multi") {
    body.enable_prompt_expansion = true;
  }
}
