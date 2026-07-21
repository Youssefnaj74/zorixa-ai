/**
 * Poll an existing MiniMax video task until Success/Fail (validates file retrieve).
 * Usage:
 *   npx vite-node -c vitest.config.ts --env-file=.env.local scripts/smoke-minimax-hailuo-poll.mts <taskId>
 */
import { fetchMinimaxVideoTask } from "../lib/minimax-video-api.ts";

const taskId = process.argv[2]?.trim();
if (!taskId) {
  console.error("Usage: … smoke-minimax-hailuo-poll.mts <taskId>");
  process.exit(1);
}

const maxWaitMs = 6 * 60 * 1000;
const intervalMs = 10_000;
const started = Date.now();

console.log("Polling MiniMax task", taskId);
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
    if (!poll.outputUrl?.startsWith("http")) {
      throw new Error("succeeded without http download url");
    }
    console.log("=== SMOKE PASS: Success + download_url OK ===");
    console.log("url host:", new URL(poll.outputUrl).host);
    process.exit(0);
  }
  if (poll.status === "failed") {
    throw new Error(`task failed: ${poll.error}`);
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}
throw new Error("timeout waiting for MiniMax video");
