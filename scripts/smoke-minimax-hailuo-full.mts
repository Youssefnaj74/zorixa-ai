/**
 * Full path smoke: create MiniMax Hailuo T2V → poll until Success + download_url.
 */
import {
  buildMinimaxHailuoVideoBody,
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

assert(isMinimaxHailuoVideoEnabled(), "MiniMax Hailuo video not enabled");

const body = buildMinimaxHailuoVideoBody({
  action: "text",
  prompt: "A ceramic cup of coffee on a marble counter, gentle steam rising, [Static shot]"
});

const submitted = await submitMinimaxHailuoVideoTask(body);
assert(submitted.ok, `create failed: ${!submitted.ok ? submitted.error : ""}`);
const taskId = decodeMinimaxVideoPredictionId(submitted.predictionId);
assert(taskId, "bad prediction id");
console.log("created task_id length:", taskId.length);

const maxWaitMs = 8 * 60 * 1000;
const intervalMs = 12_000;
const started = Date.now();

while (Date.now() - started < maxWaitMs) {
  const poll = await fetchMinimaxVideoTask(taskId);
  console.log({
    elapsedSec: Math.round((Date.now() - started) / 1000),
    status: poll.status,
    rawStatus: poll.rawStatus,
    hasUrl: Boolean(poll.outputUrl),
    error: poll.error
  });
  if (poll.status === "succeeded") {
    assert(poll.outputUrl?.startsWith("http"), "missing download url");
    console.log("=== FULL SMOKE PASS ===", new URL(poll.outputUrl!).host);
    process.exit(0);
  }
  if (poll.status === "failed") {
    throw new Error(`failed: ${poll.error}`);
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}
throw new Error("timeout");
