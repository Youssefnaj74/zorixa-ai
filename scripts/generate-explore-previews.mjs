/**
 * Generate Explore prompt previews via Atlas (3:4) from data/explore-prompts.json
 * Run: npm run generate:explore-previews
 */
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "explore-prompts");
const catalogPath = path.join(root, "data", "explore-prompts.json");

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
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

const local = parseEnvFile(path.join(root, ".env.local"));
const apiKey = (local.ATLASCLOUD_API_KEY ?? process.env.ATLASCLOUD_API_KEY ?? "").trim();
const ATLAS = "https://api.atlascloud.ai/api/v1/model";

/** Zorixa composer id → Atlas generateImage body (3:4 portrait). */
function atlasBodyForEntry(entry) {
  const prompt = entry.prompt;
  const modelId = entry.modelId;
  switch (modelId) {
    case "gpt-image-2":
      return {
        model: "openai/gpt-image-2/text-to-image",
        prompt,
        size: "1024x1536",
        quality: "medium"
      };
    case "zorixa":
      return {
        model: "qwen/qwen-image-2.0-pro/text-to-image",
        prompt,
        width: 1024,
        height: 1365
      };
    case "seedream-5":
      return {
        model: "bytedance/seedream-v5.0-lite",
        prompt,
        width: 1024,
        height: 1365
      };
    case "nano-banana-2":
      return {
        model: "google/nano-banana-2/text-to-image",
        prompt,
        width: 1024,
        height: 1365
      };
    case "nano-banana-pro":
      return {
        model: "google/nano-banana-pro/text-to-image",
        prompt,
        width: 1024,
        height: 1365
      };
    case "grok-imagine":
      return {
        model: "xai/grok-imagine-image-quality/text-to-image",
        prompt,
        width: 1024,
        height: 1365
      };
    case "flux-dev":
    case "flux-schnell":
      return {
        model:
          modelId === "flux-schnell"
            ? "black-forest-labs/flux-schnell"
            : "black-forest-labs/flux-dev",
        prompt,
        width: 1024,
        height: 1365
      };
    default:
      return null;
  }
}

function extractOutputUrl(data) {
  if (!data || typeof data !== "object") return null;
  const outputs = data.outputs;
  if (Array.isArray(outputs)) {
    for (const item of outputs) {
      if (typeof item === "string" && item.startsWith("http")) return item;
      if (item && typeof item === "object") {
        const u = item.url ?? item.uri ?? item.href;
        if (typeof u === "string" && u.startsWith("http")) return u;
      }
    }
  }
  const out = data.output;
  if (typeof out === "string" && out.startsWith("http")) return out;
  if (Array.isArray(out)) {
    for (const item of out) {
      if (typeof item === "string" && item.startsWith("http")) return item;
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollPrediction(id) {
  for (let i = 0; i < 120; i++) {
    const res = await fetch(`${ATLAS}/prediction/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store"
    });
    const json = await res.json();
    const data = json?.data ?? json;
    const status = String(data?.status ?? "").toLowerCase();
    const url = extractOutputUrl(data);
    if (url && (status === "completed" || status === "succeeded" || status === "success")) {
      return url;
    }
    if (status === "failed") {
      throw new Error(data?.error ?? json?.message ?? "Atlas prediction failed");
    }
    if (url && !status) return url;
    await sleep(3000);
  }
  throw new Error("Timed out waiting for Atlas prediction");
}

async function generateOne(entry) {
  const body = atlasBodyForEntry(entry);
  if (!body) {
    console.warn(`\n→ ${entry.id} — skip (unsupported modelId: ${entry.modelId})`);
    return null;
  }

  console.log(`\n→ ${entry.id} (${entry.modelId})`);
  const res = await fetch(`${ATLAS}/generateImage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`);
  }
  const data = json?.data ?? json;
  let imageUrl = extractOutputUrl(data);
  const predictionId = data?.id;
  if (!imageUrl && predictionId) {
    console.log(`  polling ${predictionId}…`);
    imageUrl = await pollPrediction(predictionId);
  }
  if (!imageUrl) throw new Error("No output URL from Atlas");

  const imgRes = await fetch(imageUrl, { cache: "no-store" });
  if (!imgRes.ok) throw new Error(`Download failed (${imgRes.status})`);
  const ext =
    imageUrl.includes(".png") || imgRes.headers.get("content-type")?.includes("png")
      ? "png"
      : "jpg";
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${entry.id}.${ext}`);
  if (imgRes.body) {
    await pipeline(Readable.fromWeb(imgRes.body), fs.createWriteStream(filePath));
  } else {
    fs.writeFileSync(filePath, Buffer.from(await imgRes.arrayBuffer()));
  }
  const publicPath = `/explore-prompts/${entry.id}.${ext}`;
  const bytes = fs.statSync(filePath).size;
  console.log(`  saved ${path.relative(root, filePath)} (${Math.round(bytes / 1024)} KB)`);
  return publicPath;
}

if (!apiKey) {
  console.error("Missing ATLASCLOUD_API_KEY in .env.local");
  process.exit(1);
}

if (!fs.existsSync(catalogPath)) {
  console.error("Missing data/explore-prompts.json");
  process.exit(1);
}

const entries = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
if (!Array.isArray(entries) || entries.length === 0) {
  console.log("data/explore-prompts.json is empty — run npm run import:explore-prompts first.");
  process.exit(0);
}

console.log("Generating Explore previews (3:4) via Atlas…");
let changed = false;

for (const entry of entries) {
  if (entry.imageUrl?.trim()) {
    const localPath = entry.imageUrl.replace(/^\//, "");
    if (fs.existsSync(path.join(root, "public", localPath))) {
      console.log(`\n→ ${entry.id} — skip (imageUrl set)`);
      continue;
    }
  }

  const existing = ["webp", "jpg", "jpeg", "png"].find((ext) =>
    fs.existsSync(path.join(outDir, `${entry.id}.${ext}`))
  );
  if (existing) {
    entry.imageUrl = `/explore-prompts/${entry.id}.${existing}`;
    changed = true;
    console.log(`\n→ ${entry.id} — linked existing .${existing}`);
    continue;
  }

  try {
    const publicPath = await generateOne(entry);
    if (publicPath) {
      entry.imageUrl = publicPath;
      changed = true;
    }
  } catch (e) {
    console.error(`  failed: ${e instanceof Error ? e.message : e}`);
  }
}

if (changed) {
  fs.writeFileSync(catalogPath, `${JSON.stringify(entries, null, 2)}\n`);
  console.log("\nUpdated data/explore-prompts.json with imageUrl paths.");
}
console.log("Done. Refresh /explore-prompts");
