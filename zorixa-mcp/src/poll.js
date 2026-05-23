import { zorixaFetch } from "./client.js";

const DEFAULT_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 15 * 60 * 1000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function terminalSuccess(status) {
  const s = String(status ?? "").toLowerCase();
  return s === "succeeded" || s === "completed" || s === "success";
}

function terminalFailed(status) {
  const s = String(status ?? "").toLowerCase();
  return s === "failed" || s === "error" || s === "cancelled";
}

/**
 * Poll image prediction until URL or failure.
 * @param {import("./config.js").ZorixaMcpConfig} config
 */
export async function pollImagePrediction(config, { predictionId, imageModel }) {
  const deadline = Date.now() + MAX_WAIT_MS;
  const qs = new URLSearchParams({ predictionId, imageModel });

  while (Date.now() < deadline) {
    const data = await zorixaFetch(config, `/api/generate-image?${qs}`);
    const status = data.status ?? "unknown";

    if (terminalSuccess(status) && data.image_url) {
      await zorixaFetch(config, "/api/generations/atlas-image-log", {
        method: "POST",
        body: JSON.stringify({
          output_url: data.image_url,
          prediction_id: predictionId,
          image_model: imageModel
        })
      });
      return { image_url: data.image_url, prediction_id: predictionId, status };
    }

    if (terminalFailed(status)) {
      throw new Error(data.error ?? data.atlas_error ?? "Image generation failed");
    }

    await sleep(data.poll_interval_ms ?? DEFAULT_INTERVAL_MS);
  }

  throw new Error("Image generation timed out.");
}

/**
 * Poll video prediction until URL or failure.
 * @param {import("./config.js").ZorixaMcpConfig} config
 */
export async function pollVideoPrediction(
  config,
  { predictionId, videoModel, action, inputUrl }
) {
  const deadline = Date.now() + MAX_WAIT_MS;
  const qs = new URLSearchParams({ predictionId });
  if (action && action !== "text") qs.set("action", action);

  while (Date.now() < deadline) {
    const data = await zorixaFetch(config, `/api/generate-video?${qs}`);
    const status = data.status ?? "unknown";

    if (terminalSuccess(status) && data.video_url) {
      await zorixaFetch(config, "/api/generations/atlas-video-log", {
        method: "POST",
        body: JSON.stringify({
          output_url: data.video_url,
          prediction_id: predictionId,
          video_model: videoModel,
          input_url: inputUrl ?? undefined
        })
      });
      return { video_url: data.video_url, prediction_id: predictionId, status };
    }

    if (terminalFailed(status)) {
      throw new Error(data.error ?? data.atlas_error ?? "Video generation failed");
    }

    await sleep(data.poll_interval_ms ?? DEFAULT_INTERVAL_MS);
  }

  throw new Error("Video generation timed out.");
}
