/**
 * Generate Text-to-Image showcase PNGs via Atlas Cloud.
 *
 * Prompts: data/image-t2i-showcase-recipes.json (unique per model — not dashboard copies).
 * Output: public/image-showcases/t2i/{composerModelId}.png
 *
 * Usage:
 *   npm run generate:image-t2i-showcases
 *   npm run generate:image-t2i-showcases -- --only=gpt-image-2
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "image-showcases", "t2i");
const RECIPES_PATH = path.join(ROOT, "data", "image-t2i-showcase-recipes.json");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");

/** Composer id → Atlas T2I slug (matches lib/atlas-image-model-ids.ts). */
const ATLAS_T2I_SLUG = {
  "gpt-image-2": "openai/gpt-image-2/text-to-image",
  "nano-banana-2": "google/nano-banana-2/text-to-image",
  "nano-banana-pro": "google/nano-banana-pro/text-to-image",
  zorixa: "qwen/qwen-image-2.0-pro/text-to-image",
  "seedream-5": "bytedance/seedream-v5.0-lite",
  "grok-imagine": "xai/grok-imagine-image-quality/text-to-image",
  "flux-dev": "black-forest-labs/flux-dev",
  "flux-schnell": "black-forest-labs/flux-schnell",
  "flux-dev-lora": "black-forest-labs/flux-dev-lora",
  "wan-image-2-7": "alibaba/wan-2.7/text-to-image",
  "wan-image-2-7-pro": "alibaba/wan-2.7-pro/text-to-image",
  "wan-image-2-6": "alibaba/wan-2.6/text-to-image"
};

const SEEDREAM_2K = {
  "1:1": { width: 2048, height: 2048 },
  "4:3": { width: 2304, height: 1728 },
  "3:4": { width: 1728, height: 2304 },
  "16:9": { width: 2848, height: 1600 },
  "9:16": { width: 1600, height: 2848 },
  "3:2": { width: 2496, height: 1664 },
  "2:3": { width: 1664, height: 2496 },
  "21:9": { width: 3136, height: 1344 }
};

function loadDotenv(contents) {
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

async function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    try {
      loadDotenv(await readFile(path.join(ROOT, file), "utf8"));
    } catch {
      /* optional */
    }
  }
}

function firstUrl(value) {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstUrl(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = firstUrl(item);
      if (found) return found;
    }
  }
  return null;
}

function resolutionShortSidePx(resolution) {
  switch ((resolution || "2K").trim().toUpperCase()) {
    case "4K":
      return 2048;
    case "2K":
      return 1536;
    case "1K":
    default:
      return 1024;
  }
}

function qwenSizeFromAspectAndResolution(aspectRatio, resolution) {
  const s = resolutionShortSidePx(resolution);
  const aspect = aspectRatio && aspectRatio !== "Auto" ? aspectRatio : "1:1";
  let width;
  let height;
  switch (aspect) {
    case "16:9":
      height = s;
      width = Math.round((s * 16) / 9);
      break;
    case "9:16":
      width = s;
      height = Math.round((s * 16) / 9);
      break;
    case "4:3":
      height = s;
      width = Math.round((s * 4) / 3);
      break;
    case "3:4":
      width = s;
      height = Math.round((s * 4) / 3);
      break;
    case "1:1":
    default:
      width = s;
      height = s;
      break;
  }
  width = Math.min(2048, Math.max(512, width));
  height = Math.min(2048, Math.max(512, height));
  return { width, height };
}

function gptImage2CanvasSize(aspectRatio) {
  const label = aspectRatio && aspectRatio !== "Auto" ? aspectRatio.trim() : "1:1";
  switch (label) {
    case "1:1":
      return "1024x1024";
    case "4:3":
    case "3:2":
    case "16:9":
    case "21:9":
    case "5:4":
      return "1536x1024";
    case "3:4":
    case "2:3":
    case "9:16":
    case "4:5":
      return "1024x1536";
    default:
      return "1024x1024";
  }
}

function resolutionToGptQuality(resolution) {
  switch ((resolution || "2K").trim().toUpperCase()) {
    case "4K":
    case "3K":
      return "high";
    case "2K":
      return "medium";
    case "1K":
    default:
      return "low";
  }
}

function nanoBananaResolution(resolution) {
  switch ((resolution || "2K").trim().toUpperCase()) {
    case "4K":
      return "4k";
    case "2K":
      return "2k";
    case "1K":
    default:
      return "1k";
  }
}

function seedreamPixels(resolution, aspect) {
  const tier = (resolution || "2K").trim();
  const a = aspect && aspect !== "Auto" ? aspect : "1:1";
  const row = SEEDREAM_2K[a];
  if (!row || tier !== "2K") {
    return SEEDREAM_2K["1:1"];
  }
  return row;
}

function mergeRecipe(modelId, recipe, defaults) {
  return {
    modelId,
    prompt: recipe.prompt,
    historyTitle: recipe.historyTitle,
    cameraStyle: recipe.cameraStyle ?? defaults.cameraStyle,
    resolution: recipe.resolution ?? defaults.resolution,
    aspect: recipe.aspect ?? defaults.aspect
  };
}

function buildT2iBody(modelId, atlasModel, merged) {
  const aspect = merged.aspect === "Auto" ? null : merged.aspect;
  const resolution = merged.resolution;

  if (atlasModel.includes("gpt-image-2")) {
    return {
      model: atlasModel,
      prompt: merged.prompt,
      size: gptImage2CanvasSize(merged.aspect),
      quality: resolutionToGptQuality(resolution)
    };
  }

  if (atlasModel.includes("qwen-image")) {
    const { width, height } = qwenSizeFromAspectAndResolution(aspect, resolution);
    return { model: atlasModel, prompt: merged.prompt, width, height };
  }

  if (atlasModel.includes("seedream")) {
    const { width, height } = seedreamPixels(resolution, merged.aspect);
    return {
      model: atlasModel,
      prompt: merged.prompt,
      width,
      height,
      size: `${width}*${height}`
    };
  }

  if (/black-forest-labs\/flux|alibaba\/wan/i.test(atlasModel)) {
    const { width, height } = qwenSizeFromAspectAndResolution(aspect, resolution);
    return { model: atlasModel, prompt: merged.prompt, width, height };
  }

  if (/google\/nano-banana/i.test(atlasModel)) {
    const body = {
      model: atlasModel,
      prompt: merged.prompt,
      resolution: nanoBananaResolution(resolution)
    };
    if (aspect) body.aspect_ratio = aspect;
    return body;
  }

  const body = { model: atlasModel, prompt: merged.prompt };
  if (aspect) {
    body.aspect_ratio = aspect;
    body.aspectRatio = aspect;
  }
  const { width, height } = qwenSizeFromAspectAndResolution(aspect, resolution);
  body.size = `${width}*${height}`;
  return body;
}

async function pollUntilDone(apiKey, predictionId) {
  for (let i = 0; i < 90; i++) {
    const pollRes = await fetch(`${ATLAS_BASE}/prediction/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store"
    });
    const pollJson = await pollRes.json();
    if (!pollRes.ok) {
      throw new Error(pollJson.message || `Poll failed (${pollRes.status})`);
    }

    const status = String(pollJson?.data?.status || "").toLowerCase();
    const outputUrl =
      firstUrl(pollJson?.data?.outputs) || firstUrl(pollJson?.data?.output);
    if (outputUrl && ["completed", "succeeded", "success"].includes(status)) {
      return outputUrl;
    }
    if (status === "failed") {
      throw new Error(
        pollJson?.data?.error || pollJson?.data?.logs || pollJson.message || "Prediction failed"
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error("Timed out waiting for Atlas image");
}

async function downloadImage(url, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  await writeFile(targetPath, Buffer.from(await res.arrayBuffer()));
}

async function generateOne(apiKey, modelId, recipe, defaults) {
  const atlasModel = ATLAS_T2I_SLUG[modelId];
  if (!atlasModel) throw new Error(`No Atlas T2I slug for ${modelId}`);

  const merged = mergeRecipe(modelId, recipe, defaults);
  const body = buildT2iBody(modelId, atlasModel, merged);

  const createRes = await fetch(`${ATLAS_BASE}/generateImage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const createJson = await createRes.json();
  if (!createRes.ok) {
    throw new Error(
      createJson.message || createJson.error || `Atlas failed (${createRes.status})`
    );
  }

  const predictionId = createJson?.data?.id;
  if (!predictionId) throw new Error("Atlas did not return prediction id");

  console.log(`[t2i-showcase] ${modelId} submitted → ${predictionId}`);
  const outputUrl = await pollUntilDone(apiKey, predictionId);

  const filename = `${modelId}.png`;
  const target = path.join(OUT_DIR, filename);
  await downloadImage(outputUrl, target);
  console.log(`[t2i-showcase] saved public/image-showcases/t2i/${filename}`);

  return {
    modelId,
    atlasModel,
    prompt: merged.prompt,
    aspect: merged.aspect,
    resolution: merged.resolution,
    publicPath: `/image-showcases/t2i/${filename}`,
    atlasOutputUrl: outputUrl,
    predictionId
  };
}

await loadEnvFiles();
const apiKey = process.env.ATLASCLOUD_API_KEY?.trim();
if (!apiKey) {
  throw new Error("Missing ATLASCLOUD_API_KEY in .env.local");
}

const recipesFile = JSON.parse(await readFile(RECIPES_PATH, "utf8"));
const defaults = recipesFile.defaults;
const models = recipesFile.models;

const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const onlySet = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;

await mkdir(OUT_DIR, { recursive: true });

let manifest = { generatedAt: null, items: {} };
try {
  manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
} catch {
  /* fresh */
}

const entries = Object.entries(models).filter(([id]) => !onlySet || onlySet.has(id));

for (const [modelId, recipe] of entries) {
  if (!onlySet && manifest.items?.[modelId]?.publicPath) {
    try {
      await readFile(path.join(ROOT, "public", manifest.items[modelId].publicPath.replace(/^\//, "")));
      console.log(`[t2i-showcase] skip ${modelId} (file exists)`);
      continue;
    } catch {
      /* regen */
    }
  }

  console.log(`[t2i-showcase] generating ${modelId}…`);
  try {
    const entry = await generateOne(apiKey, modelId, recipe, defaults);
    manifest.items = manifest.items ?? {};
    manifest.items[modelId] = entry;
    manifest.generatedAt = new Date().toISOString();
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  } catch (error) {
    console.error(`[t2i-showcase] failed ${modelId}:`, error?.message || error);
  }
}

console.log(
  `[t2i-showcase] done — ${Object.keys(manifest.items ?? {}).length}/${Object.keys(models).length} in manifest`
);
