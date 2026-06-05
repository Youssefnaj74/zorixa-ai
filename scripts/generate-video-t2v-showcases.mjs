/**
 * Generate Text-to-Video showcase clips (9:16 · 720p/480p · ~5s) via Atlas Cloud.
 *
 * Prompts live in data/video-t2v-showcase-recipes.json — must be UNIQUE scenes
 * (do not reuse dashboard-seedance CLIPS prompts; user provides T2V-only copy).
 *
 * Output: public/video-showcases/t2v/{composerModelId}.mp4
 *
 * Usage:
 *   npm run generate:video-t2v-showcases
 *   npm run generate:video-t2v-showcases -- --only=seedance-2
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "video-showcases", "t2v");
const RECIPES_PATH = path.join(ROOT, "data", "video-t2v-showcase-recipes.json");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");

const FPS = 24;

/** Composer id → Atlas T2V slug (matches lib/atlas-video-model-ids.ts). */
const ATLAS_T2V_SLUG = {
  "grok-imagine-video-t2v": "xai/grok-imagine-video/text-to-video",
  "gemini-omni-flash-t2v": "google/gemini-omni-flash/text-to-video-developer",
  "kling-3-pro": "kwaivgi/kling-v3.0-pro/text-to-video",
  "seedance-2": "bytedance/seedance-2.0/text-to-video",
  "seedance-1-5": "bytedance/seedance-v1.5-pro/text-to-video",
  "wan-2-6": "alibaba/wan-2.6/text-to-video",
  "wan-2-7": "alibaba/wan-2.7/text-to-video",
  "happyhorse-1": "alibaba/happyhorse-1.0/text-to-video",
  "hailuo-2-3": "minimax/hailuo-2.3/t2v-pro",
  "google-veo-3-1": "google/veo3.1/text-to-video",
  "vidu-q3": "vidu/q3/reference-to-video",
  "vidu-q3-pro": "vidu/q3-pro/text-to-video"
};

const SEEDANCE_9_16 = {
  "480p": { width: 480, height: 864 },
  "720p": { width: 720, height: 1280 },
  "1080p": { width: 1080, height: 1920 }
};

function snap(n) {
  return Math.max(64, Math.round(n / 8) * 8);
}

function seedanceDims(aspect, resolution) {
  const row = SEEDANCE_9_16;
  const preset = row[resolution] ?? row["720p"];
  const logical = { width: snap(preset.width), height: snap(preset.height) };
  if (aspect === "9:16") {
    return { width: logical.height, height: logical.width, logical };
  }
  return { ...logical, logical };
}

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

function mergeRecipeDefaults(modelId, recipe, defaults) {
  return {
    modelId,
    prompt: recipe.prompt,
    historyTitle: recipe.historyTitle,
    aspect: recipe.aspect ?? defaults.aspect,
    resolution: recipe.resolution ?? defaults.resolution,
    timeSeconds: recipe.timeSeconds ?? defaults.timeSeconds
  };
}

function buildT2vBody(modelId, atlasModel, recipe) {
  const aspect = recipe.aspect;
  const resolution = recipe.resolution;
  const duration = recipe.timeSeconds;
  const prompt = `${recipe.prompt}\n\nVertical ${aspect} portrait video, tall mobile frame.`;

  if (modelId === "grok-imagine-video-t2v") {
    return {
      model: atlasModel,
      prompt,
      duration: Math.min(15, Math.max(1, duration)),
      aspect_ratio: aspect,
      resolution: resolution === "480p" ? "480p" : "720p"
    };
  }

  if (modelId === "gemini-omni-flash-t2v") {
    const d = [4, 6, 8, 10].reduce((best, opt) =>
      Math.abs(opt - duration) < Math.abs(best - duration) ? opt : best
    );
    return {
      model: atlasModel,
      prompt,
      aspect_ratio: aspect === "9:16" ? "9:16" : "16:9",
      resolution: resolution.toLowerCase() === "1080p" ? "1080p" : "720p",
      duration: d,
      seed: -1
    };
  }

  if (modelId === "kling-3-pro") {
    return {
      model: atlasModel,
      prompt,
      duration: Math.min(15, Math.max(3, duration)),
      fps: FPS,
      aspect_ratio: aspect === "9:16" ? "9:16" : aspect === "1:1" ? "1:1" : "16:9"
    };
  }

  if (modelId === "seedance-2" || modelId === "seedance-1-5") {
    const dims = seedanceDims(aspect, resolution);
    return {
      model: atlasModel,
      prompt,
      width: dims.width,
      height: dims.height,
      duration,
      fps: FPS,
      aspect_ratio: aspect
    };
  }

  if (modelId === "google-veo-3-1") {
    const res = resolution.toLowerCase() === "1080p" ? "1080p" : "720p";
    const d = res === "1080p" ? 8 : duration <= 5 ? 4 : duration <= 7 ? 6 : 8;
    return {
      model: atlasModel,
      prompt,
      aspect_ratio: aspect === "9:16" ? "9:16" : "16:9",
      resolution: res,
      duration: d,
      generate_audio: false
    };
  }

  if (modelId === "hailuo-2-3") {
    return {
      model: atlasModel,
      prompt,
      enable_prompt_expansion: true
    };
  }

  if (modelId === "happyhorse-1") {
    return {
      model: atlasModel,
      prompt,
      aspect_ratio: aspect,
      resolution: resolution.toLowerCase() === "1080p" ? "1080P" : "720P",
      duration: Math.min(15, Math.max(3, duration)),
      fps: FPS
    };
  }

  if (modelId === "wan-2-7") {
    return {
      model: atlasModel,
      prompt,
      aspect_ratio: aspect,
      resolution: resolution.toLowerCase() === "1080p" ? "1080p" : "720p",
      duration: Math.min(10, Math.max(2, duration)),
      fps: FPS,
      generate_audio: false
    };
  }

  if (modelId === "vidu-q3-pro" || modelId === "vidu-q3") {
    return {
      model: atlasModel,
      prompt,
      duration: Math.min(16, Math.max(1, duration)),
      aspect_ratio: aspect,
      resolution: resolution.toLowerCase() === "1080p" ? "1080p" : "720p",
      fps: FPS
    };
  }

  return {
    model: atlasModel,
    prompt,
    duration,
    fps: FPS,
    aspect_ratio: aspect,
    resolution: resolution.toLowerCase() === "1080p" ? "1080p" : "720p"
  };
}

async function pollUntilDone(apiKey, predictionId) {
  for (let i = 0; i < 240; i++) {
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
      const err =
        pollJson?.data?.error ||
        pollJson?.data?.logs ||
        pollJson.message ||
        "Prediction failed";
      throw new Error(typeof err === "string" ? err : JSON.stringify(err));
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error("Timed out waiting for Atlas video");
}

async function downloadFile(url, targetPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  await writeFile(targetPath, Buffer.from(await res.arrayBuffer()));
}

async function generateOne(apiKey, modelId, recipe, defaults) {
  const atlasModel = ATLAS_T2V_SLUG[modelId];
  if (!atlasModel) throw new Error(`No Atlas T2V slug for ${modelId}`);

  const merged = mergeRecipeDefaults(modelId, recipe, defaults);
  const body = buildT2vBody(modelId, atlasModel, merged);

  const createRes = await fetch(`${ATLAS_BASE}/generateVideo`, {
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

  console.log(`[t2v-showcase] ${modelId} submitted → ${predictionId}`);
  const outputUrl = await pollUntilDone(apiKey, predictionId);

  const filename = `${modelId}.mp4`;
  const target = path.join(OUT_DIR, filename);
  await downloadFile(outputUrl, target);
  console.log(`[t2v-showcase] saved public/video-showcases/t2v/${filename}`);

  return {
    modelId,
    atlasModel,
    prompt: merged.prompt,
    aspect: merged.aspect,
    resolution: merged.resolution,
    timeSeconds: merged.timeSeconds,
    publicPath: `/video-showcases/t2v/${filename}`,
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

let manifest = {};
try {
  manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
} catch {
  manifest = { generatedAt: null, items: {} };
}

const entries = Object.entries(models).filter(([id]) => !onlySet || onlySet.has(id));

for (const [modelId, recipe] of entries) {
  if (!onlySet && manifest.items?.[modelId]?.publicPath) {
    try {
      await readFile(path.join(ROOT, "public", manifest.items[modelId].publicPath.replace(/^\//, "")));
      console.log(`[t2v-showcase] skip ${modelId} (file exists)`);
      continue;
    } catch {
      /* regen */
    }
  }

  console.log(`[t2v-showcase] generating ${modelId}…`);
  try {
    const entry = await generateOne(apiKey, modelId, recipe, defaults);
    manifest.items = manifest.items ?? {};
    manifest.items[modelId] = entry;
    manifest.generatedAt = new Date().toISOString();
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  } catch (error) {
    console.error(`[t2v-showcase] failed ${modelId}:`, error?.message || error);
  }
}

console.log(
  `[t2v-showcase] done — ${Object.keys(manifest.items ?? {}).length}/${Object.keys(models).length} in manifest`
);
