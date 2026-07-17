/**
 * Live ZorixaAI Assistant evaluation (≥100 real-world questions).
 *
 * Usage:
 *   npm run eval:assistant
 *   npm run eval:assistant -- --limit=20
 *
 * Requires ATLASCLOUD_API_KEY in .env.local
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatEvalReportMarkdown,
  runAssistantEvaluation,
  writeEvalReportFiles
} from "../lib/zorixa-assistant-eval/run";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseEnvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadEnv() {
  const local = parseEnvFile(path.join(root, ".env.local"));
  for (const [k, v] of Object.entries(local)) {
    if (!process.env[k]) process.env[k] = v;
  }
}

function parseArgs(argv: string[]) {
  let limit: number | undefined;
  const ids: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length));
    } else if (arg.startsWith("--ids=")) {
      ids.push(
        ...arg
          .slice("--ids=".length)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }
  return { limit, ids };
}

loadEnv();

async function main() {
  if (!process.env.ATLASCLOUD_API_KEY?.trim()) {
    console.error("Missing ATLASCLOUD_API_KEY in .env.local");
    process.exit(1);
  }

  const { limit, ids } = parseArgs(process.argv.slice(2));
  console.log("Running ZorixaAI Assistant evaluation…");
  const report = await runAssistantEvaluation({
    limit,
    ids: ids.length ? ids : undefined
  });

  const outDir = path.join(root, "tmp");
  const { jsonPath, mdPath } = writeEvalReportFiles(report, outDir);
  console.log(formatEvalReportMarkdown(report));
  console.log(`\nWrote:\n- ${mdPath}\n- ${jsonPath}`);

  if (!report.meetsReleaseGate || report.productionReadiness !== "ready_for_chat_ui") {
    console.error(
      `\nRelease gate failed: pass=${report.passRatePercent}, readiness=${report.productionReadiness}, confidence=${report.confidencePercent}`
    );
    process.exit(2);
  }
  console.log("\nRelease gate passed. Backend is production-ready for Chat UI.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
