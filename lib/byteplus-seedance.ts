import type { AtlasVideoRouteAction, AtlasVideoSpeedTier } from "@/lib/atlas-video-model-ids";
import {
  encodeBytePlusPredictionId,
  type BytePlusContentItem,
  type BytePlusCreateTaskBody,
  createBytePlusVideoTask
} from "@/lib/byteplus-api";
import {
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_IMAGES,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS,
  normalizeSeedanceReferenceDurationSeconds,
  normalizeSeedanceReferenceResolution,
  uiAspectToAtlasRatio
} from "@/lib/atlas-seedance-reference-video";
import { env } from "@/lib/env";
import { augmentSeedancePromptForAspect } from "@/lib/seedance-atlas-dimensions";
import { ensureSeedanceReferenceTokensInPrompt } from "@/lib/seedance-reference-prompt-tokens";

/** Official BytePlus ModelArk Dreamina Seedance 2.0 model ID (standard tier). */
export const BYTEPLUS_SEEDANCE_20_MODEL = "dreamina-seedance-2-0-260128";

export type BytePlusSeedanceWorkflow =
  | "text-to-video"
  | "image-to-video"
  | "reference-to-video"
  | "video-extension"
  | "video-editing";

export function isBytePlusSeedanceEnabled(): boolean {
  return env.bytePlusSeedanceEnabled && env.bytePlusApiKey.length > 0;
}

/**
 * BytePlus is primary for Seedance 2.0 standard tier only.
 * Fast tier stays on Atlas Cloud per product requirements.
 */
export function shouldUseBytePlusForSeedance(
  composerModelId: string,
  speedTier: AtlasVideoSpeedTier
): boolean {
  return composerModelId === "seedance-2" && speedTier === "standard" && isBytePlusSeedanceEnabled();
}

export function normalizeBytePlusSeedanceDuration(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 5;
  return Math.min(15, Math.max(4, Math.round(raw)));
}

const ALLOWED_RESOLUTIONS = new Set(["480p", "720p", "1080p", "4k"]);

export function normalizeBytePlusSeedanceResolution(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v === "480p") return "720p";
  return ALLOWED_RESOLUTIONS.has(v) ? v : "720p";
}

function textContentItem(prompt: string): BytePlusContentItem {
  return { type: "text", text: prompt };
}

function imageContentItem(
  url: string,
  role: "first_frame" | "last_frame" | "reference_image"
): BytePlusContentItem {
  return { type: "image_url", image_url: { url }, role };
}

function videoContentItem(url: string): BytePlusContentItem {
  return { type: "video_url", video_url: { url }, role: "reference_video" };
}

function audioContentItem(url: string): BytePlusContentItem {
  return { type: "audio_url", audio_url: { url }, role: "reference_audio" };
}

export function detectBytePlusSeedanceWorkflow(
  action: AtlasVideoRouteAction,
  input: {
    imageUrl?: string;
    lastImageUrl?: string;
    videoUrl?: string;
    referenceImages?: string[];
    referenceVideos?: string[];
  }
): BytePlusSeedanceWorkflow {
  if (action === "reference") return "reference-to-video";
  if (action === "image") return "image-to-video";
  if (action === "edit" && input.videoUrl) {
    const hasEditRefs =
      (input.referenceImages?.length ?? 0) > 0 || Boolean(input.imageUrl);
    return hasEditRefs ? "video-editing" : "video-extension";
  }
  return "text-to-video";
}

export function buildBytePlusSeedanceBody(input: {
  action: AtlasVideoRouteAction;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  generateAudio: boolean;
  imageUrl?: string;
  lastImageUrl?: string;
  videoUrl?: string;
  referenceImages?: string[];
  referenceVideos?: string[];
  referenceAudios?: string[];
}): BytePlusCreateTaskBody {
  const workflow = detectBytePlusSeedanceWorkflow(input.action, input);
  const ratio = uiAspectToAtlasRatio(input.aspectRatio);
  const resolution = normalizeBytePlusSeedanceResolution(input.resolution);
  const duration = normalizeBytePlusSeedanceDuration(
    input.action === "reference"
      ? normalizeSeedanceReferenceDurationSeconds(input.durationSec)
      : input.durationSec
  );

  let prompt = input.prompt.trim();
  if (workflow === "text-to-video" || workflow === "image-to-video") {
    prompt = augmentSeedancePromptForAspect(prompt, input.aspectRatio);
  }

  const content: BytePlusContentItem[] = [];

  if (workflow === "text-to-video") {
    content.push(textContentItem(prompt));
  } else if (workflow === "image-to-video") {
    const imageUrl = input.imageUrl?.trim();
    if (!imageUrl) {
      throw new Error("Missing image for Seedance image-to-video");
    }
    if (prompt) content.push(textContentItem(prompt));
    content.push(imageContentItem(imageUrl, "first_frame"));
    const lastImage = input.lastImageUrl?.trim();
    if (lastImage) {
      content.push(imageContentItem(lastImage, "last_frame"));
    }
  } else if (workflow === "reference-to-video") {
    const images = (input.referenceImages ?? []).slice(0, SEEDANCE_REFERENCE_TO_VIDEO_MAX_IMAGES);
    const videos = (input.referenceVideos ?? []).slice(0, SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS);
    const audios = (input.referenceAudios ?? []).slice(0, SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS);

    prompt = ensureSeedanceReferenceTokensInPrompt(prompt, {
      imageCount: images.length,
      videoCount: videos.length,
      audioCount: audios.length
    });
    if (prompt) content.push(textContentItem(prompt));
    for (const url of images) content.push(imageContentItem(url, "reference_image"));
    for (const url of videos) content.push(videoContentItem(url));
    for (const url of audios) content.push(audioContentItem(url));
  } else if (workflow === "video-editing") {
    const videoUrl = input.videoUrl?.trim();
    if (!videoUrl) throw new Error("Missing video for Seedance video editing");

    const refImages = [
      ...(input.referenceImages ?? []),
      ...(input.imageUrl ? [input.imageUrl] : [])
    ]
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, SEEDANCE_REFERENCE_TO_VIDEO_MAX_IMAGES);

    prompt = ensureSeedanceReferenceTokensInPrompt(prompt, {
      imageCount: refImages.length,
      videoCount: 1,
      audioCount: 0
    });
    if (prompt) content.push(textContentItem(prompt));
    for (const url of refImages) content.push(imageContentItem(url, "reference_image"));
    content.push(videoContentItem(videoUrl));
  } else {
    // video-extension
    const videoUrl = input.videoUrl?.trim();
    if (!videoUrl) throw new Error("Missing video for Seedance video extension");

    const extraVideos = (input.referenceVideos ?? [])
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS - 1);

    prompt = ensureSeedanceReferenceTokensInPrompt(prompt, {
      imageCount: 0,
      videoCount: 1 + extraVideos.length,
      audioCount: 0
    });
    if (prompt) content.push(textContentItem(prompt));
    content.push(videoContentItem(videoUrl));
    for (const url of extraVideos) content.push(videoContentItem(url));
  }

  const body: BytePlusCreateTaskBody = {
    model: BYTEPLUS_SEEDANCE_20_MODEL,
    content,
    ratio,
    resolution:
      workflow === "reference-to-video"
        ? normalizeSeedanceReferenceResolution(input.resolution)
        : resolution,
    duration,
    generate_audio: input.generateAudio,
    watermark: false
  };

  if (workflow === "image-to-video" && input.lastImageUrl?.trim()) {
    body.return_last_frame = true;
  }

  return body;
}

export type BytePlusSeedanceSubmitResult =
  | { ok: true; predictionId: string; status: string; outputUrl: string | null }
  | { ok: false; error: string };

/** Submit Seedance 2.0 to BytePlus ModelArk. Returns failure info for Atlas fallback. */
export async function submitBytePlusSeedanceTask(
  body: BytePlusCreateTaskBody
): Promise<BytePlusSeedanceSubmitResult> {
  try {
    const created = await createBytePlusVideoTask(body);
    const statusNorm = created.status.toLowerCase();
    if (statusNorm === "failed" || statusNorm === "expired" || statusNorm === "cancelled") {
      return { ok: false, error: `BytePlus task ${created.status}` };
    }
    return {
      ok: true,
      predictionId: encodeBytePlusPredictionId(created.taskId),
      status: created.status,
      outputUrl: created.outputUrl
    };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "BytePlus Seedance generation failed";
    console.warn("[byteplus-seedance] create failed, will fallback to Atlas", { error: msg });
    return { ok: false, error: msg };
  }
}
