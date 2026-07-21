/**
 * Live smoke: MiniMax Hailuo 2.3 Image-to-Video create + query.
 * Usage: npx vite-node -c vitest.config.ts scripts/smoke-minimax-hailuo-i2v.mts
 * (loads .env.local via --env-file if passed)
 */
import {
  buildMinimaxHailuoVideoBody,
  diagnoseMinimaxHailuoRouting,
  isMinimaxHailuoVideoEnabled,
  submitMinimaxHailuoVideoTask
} from "../lib/minimax-hailuo-video.ts";
import {
  decodeMinimaxVideoPredictionId,
  fetchMinimaxVideoTask
} from "../lib/minimax-video-api.ts";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const IMAGE =
  process.env.HAILUO_SMOKE_IMAGE_URL?.trim() ||
  "https://filecdn.minimax.chat/public/85c96368-6ead-4eae-af9c-116be878eac3.png";

console.log("=== MiniMax Hailuo I2V smoke ===");
assert(isMinimaxHailuoVideoEnabled(), "MINIMAX Hailuo video not enabled");

const diag = diagnoseMinimaxHailuoRouting({
  videoModel: "hailuo-2-3",
  action: "image"
});
assert(diag.hailuoMinimaxEligible, `not eligible: ${diag.skipReasons.join("; ")}`);

const body = buildMinimaxHailuoVideoBody({
  action: "image",
  prompt: "Contemporary dance, the people in the picture are performing contemporary dance.",
  durationSec: 6,
  imageUrl: IMAGE
});
console.log("create body:", {
  model: body.model,
  duration: body.duration,
  resolution: body.resolution,
  hasImage: Boolean(body.first_frame_image),
  prompt_optimizer: body.prompt_optimizer
});

const submitted = await submitMinimaxHailuoVideoTask(body);
assert(submitted.ok, `create failed: ${!submitted.ok ? submitted.error : ""}`);
console.log("create ok:", submitted.predictionId.slice(0, 24) + "…");

const taskId = decodeMinimaxVideoPredictionId(submitted.predictionId);
assert(taskId, "bad prediction id");

const poll = await fetchMinimaxVideoTask(taskId);
console.log("first poll:", {
  status: poll.status,
  rawStatus: poll.rawStatus,
  error: poll.error
});
assert(
  poll.status === "processing" || poll.status === "succeeded" || poll.status === "failed",
  `unexpected status ${poll.status}`
);

console.log("=== SMOKE PASS: MiniMax Hailuo I2V create + query OK ===");
