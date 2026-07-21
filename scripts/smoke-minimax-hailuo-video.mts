/**
 * Live smoke: MiniMax Hailuo 2.3 create + query (no full wait for video).
 * Usage: node --env-file=.env.local --import tsx scripts/smoke-minimax-hailuo-video.mts
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

console.log("=== MiniMax Hailuo smoke ===");
console.log("enabled:", isMinimaxHailuoVideoEnabled());

const diag = diagnoseMinimaxHailuoRouting({
  videoModel: "hailuo-2-3",
  action: "text"
});
console.log("eligible:", diag.hailuoMinimaxEligible);
console.log("skipReasons:", diag.skipReasons);

assert(diag.hailuoMinimaxEligible, "Hailuo MiniMax not eligible — check MINIMAX_API_KEY + MINIMAX_HAILUO_VIDEO_ENABLED");

const body = buildMinimaxHailuoVideoBody({
  action: "text",
  prompt: "A red apple slowly rotating on a wooden table, soft natural light, [Static shot]"
});
console.log("create body:", {
  model: body.model,
  duration: body.duration,
  resolution: body.resolution,
  promptLen: body.prompt.length
});

const submitted = await submitMinimaxHailuoVideoTask(body);
assert(submitted.ok, `create failed: ${!submitted.ok ? submitted.error : ""}`);
console.log("create ok:", {
  predictionIdPrefix: submitted.predictionId.slice(0, 20) + "…",
  status: submitted.status
});

const taskId = decodeMinimaxVideoPredictionId(submitted.predictionId);
assert(taskId, "could not decode minimax prediction id");

const poll = await fetchMinimaxVideoTask(taskId);
console.log("first poll:", {
  status: poll.status,
  rawStatus: poll.rawStatus,
  hasUrl: Boolean(poll.outputUrl),
  error: poll.error
});

assert(
  poll.status === "processing" || poll.status === "succeeded" || poll.status === "failed",
  `unexpected poll status: ${poll.status}`
);

// Balance / auth failures usually surface on create. If first poll is already failed
// with a hard auth/balance message, treat as smoke failure.
if (poll.status === "failed") {
  const err = (poll.error ?? "").toLowerCase();
  if (
    err.includes("balance") ||
    err.includes("insufficient") ||
    err.includes("1008") ||
    err.includes("1004") ||
    err.includes("2049") ||
    err.includes("api key")
  ) {
    throw new Error(`MiniMax hard failure on poll: ${poll.error}`);
  }
  console.warn("task failed (content/moderation?) — create+poll path still works:", poll.error);
}

console.log("=== SMOKE PASS: MiniMax Hailuo T2V create + query OK ===");
