import { z } from "zod";
import { zorixaFetch } from "../client.js";
import { pollVideoPrediction } from "../poll.js";

export const generateVideoSchema = {
  prompt: z.string().min(1).describe("Motion / scene prompt"),
  video_model: z
    .string()
    .default("seedance-2")
    .describe("Zorixa composer id, e.g. seedance-2, kling-3-pro, wan-2-7"),
  action: z
    .enum(["text", "image", "reference", "edit", "start-end"])
    .default("text")
    .describe("Atlas route action"),
  aspect_ratio: z.string().optional(),
  resolution: z.string().optional(),
  duration: z.number().int().min(1).max(60).optional(),
  image_url: z.string().url().optional().describe("Start frame for image-to-video"),
  video_url: z.string().url().optional().describe("Source video for video-to-video"),
  generate_audio: z.boolean().optional()
};

/**
 * @param {import("../config.js").ZorixaMcpConfig} config
 */
export async function generateVideo(config, args) {
  const body = {
    prompt: args.prompt,
    videoModel: args.video_model,
    action: args.action,
    aspectRatio: args.aspect_ratio,
    resolution: args.resolution,
    duration: args.duration,
    image_url: args.image_url,
    video_url: args.video_url,
    generate_audio: args.generate_audio
  };

  const create = await zorixaFetch(config, "/api/generate-video", {
    method: "POST",
    body: JSON.stringify(body)
  });

  const syncUrl = create.video_url ?? create.videoUrl;
  if (syncUrl) {
    await zorixaFetch(config, "/api/generations/atlas-video-log", {
      method: "POST",
      body: JSON.stringify({
        output_url: syncUrl,
        prediction_id: create.prediction_id ?? create.predictionId ?? null,
        video_model: args.video_model,
        input_url: args.image_url ?? args.video_url ?? null
      })
    });
    return {
      video_url: syncUrl,
      prediction_id: create.prediction_id ?? create.predictionId ?? null,
      saved_to_zorixa_dashboard: true
    };
  }

  const predictionId = create.prediction_id ?? create.predictionId;
  if (!predictionId) {
    throw new Error("No prediction id returned from Zorixa.");
  }

  const result = await pollVideoPrediction(config, {
    predictionId,
    videoModel: args.video_model,
    action: args.action,
    inputUrl: args.image_url ?? args.video_url ?? null
  });

  return {
    ...result,
    saved_to_zorixa_dashboard: true
  };
}
