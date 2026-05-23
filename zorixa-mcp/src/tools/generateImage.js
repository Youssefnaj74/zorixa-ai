import { z } from "zod";
import { zorixaFetch } from "../client.js";
import { pollImagePrediction } from "../poll.js";

export const generateImageSchema = {
  prompt: z.string().min(1).describe("Text prompt for image generation"),
  image_model: z
    .string()
    .default("gpt-image-2")
    .describe("Zorixa composer id, e.g. gpt-image-2, nano-banana-pro, seedream-5"),
  aspect_ratio: z.string().optional().describe("e.g. 16:9, 9:16, 1:1"),
  resolution: z.string().optional().describe("e.g. 720p, 1080p"),
  image_urls: z
    .array(z.string().url())
    .optional()
    .describe("Reference images for edit mode (public https URLs)")
};

/**
 * @param {import("../config.js").ZorixaMcpConfig} config
 */
export async function generateImage(config, args) {
  const body = {
    prompt: args.prompt,
    imageModel: args.image_model,
    aspectRatio: args.aspect_ratio,
    resolution: args.resolution,
    image_urls: args.image_urls
  };

  const create = await zorixaFetch(config, "/api/generate-image", {
    method: "POST",
    body: JSON.stringify(body)
  });

  if (create.image_url) {
    await zorixaFetch(config, "/api/generations/atlas-image-log", {
      method: "POST",
      body: JSON.stringify({
        output_url: create.image_url,
        prediction_id: create.prediction_id ?? null,
        image_model: args.image_model,
        prompt: args.prompt
      })
    });
    return {
      image_url: create.image_url,
      prediction_id: create.prediction_id ?? null,
      saved_to_zorixa_dashboard: true
    };
  }

  const predictionId = create.prediction_id;
  if (!predictionId) {
    throw new Error("No prediction id returned from Zorixa.");
  }

  const result = await pollImagePrediction(config, {
    predictionId,
    imageModel: args.image_model,
    prompt: args.prompt
  });

  return {
    ...result,
    saved_to_zorixa_dashboard: true
  };
}
