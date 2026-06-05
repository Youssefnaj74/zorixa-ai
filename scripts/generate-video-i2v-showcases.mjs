/**
 * Generate Image-to-Video showcase clips via Atlas Cloud.
 *
 * Per-model niche start frame (T2I) + motion prompt (I2V).
 * Prompts: data/video-i2v-showcase-recipes.json
 * Output:
 *   public/video-showcases/i2v/{modelId}-start.png
 *   public/video-showcases/i2v/{modelId}.mp4
 *
 * Usage:
 *   npm run generate:video-i2v-showcases
 *   npm run generate:video-i2v-showcases -- --only=seedance-2
 *   npm run generate:video-i2v-showcases -- --force-start
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "video-showcases", "i2v");
const RECIPES_PATH = path.join(ROOT, "data", "video-i2v-showcase-recipes.json");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");

const FPS = 24;

const ATLAS_I2V_SLUG = {
  "grok-imagine-video-i2v-15": "xai/grok-imagine-video-v1.5/image-to-video",
  "gemini-omni-flash-i2v": "google/gemini-omni-flash/image-to-video-developer",
  "kling-3-pro": "kwaivgi/kling-v3.0-pro/image-to-video",
  "seedance-2": "bytedance/seedance-2.0/image-to-video",
  "seedance-1-5": "bytedance/seedance-v1.5-pro/image-to-video",
  "wan-2-6": "alibaba/wan-2.6/image-to-video",
  "wan-2-7": "alibaba/wan-2.7/image-to-video",
  "happyhorse-1": "alibaba/happyhorse-1.0/image-to-video",
  "hailuo-2-3": "minimax/hailuo-2.3/i2v-standard",
  "google-veo-3-1": "google/veo3.1/image-to-video",
  "vidu-q3": "vidu/q3/reference-to-video",
  "vidu-q3-pro": "vidu/q3-pro/image-to-video"
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
  const preset = SEEDANCE_9_16[resolution] ?? SEEDANCE_9_16["720p"];
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

function mergeRecipe(modelId, recipe, defaults) {
  return {
    modelId,
    prompt: recipe.prompt,
    startFramePrompt: recipe.startFramePrompt,
    historyTitle: recipe.historyTitle,
    aspect: recipe.aspect ?? defaults.aspect,
    resolution: recipe.resolution ?? defaults.resolution,
    timeSeconds: recipe.timeSeconds ?? defaults.timeSeconds
  };
}

function normalizeHailuoI2vDuration(seconds) {
  return Math.round(seconds) >= 8 ? 10 : 6;
}

function normalizeGeminiDuration(seconds) {
  return [4, 6, 8, 10].reduce((best, opt) =>
    Math.abs(opt - seconds) < Math.abs(best - seconds) ? opt : best
  );
}

function normalizeVeoDuration(seconds, resolution) {
  const res = resolution.toLowerCase() === "1080p" ? "1080p" : "720p";
  if (res === "1080p") return 8;
  if (seconds <= 5) return 4;
  if (seconds <= 7) return 6;
  return 8;
}

function startFrameT2iBody(prompt) {
  return {
    model: "openai/gpt-image-2/text-to-image",
    prompt,
    size: "1024x1536",
    quality: "medium"
  };
}

function buildI2vBody(modelId, atlasModel, merged, startUrl) {
  const { aspect, resolution, timeSeconds: duration, prompt } = merged;

  if (modelId === "grok-imagine-video-i2v-15") {
    return {
      model: atlasModel,
      prompt,
      duration: Math.min(15, Math.max(1, duration)),
      aspect_ratio: aspect,
      resolution: resolution === "480p" ? "480p" : "720p",
      image_url: startUrl
    };
  }

  if (modelId === "gemini-omni-flash-i2v") {
    return {
      model: atlasModel,
      prompt,
      aspect_ratio: aspect === "9:16" ? "9:16" : "16:9",
      resolution: resolution.toLowerCase() === "1080p" ? "1080p" : "720p",
      duration: normalizeGeminiDuration(duration),
      seed: -1,
      images: [startUrl]
    };
  }

  if (modelId === "kling-3-pro") {
    return {
      model: atlasModel,
      prompt,
      duration: Math.min(15, Math.max(3, duration)),
      aspect_ratio: aspect === "9:16" ? "9:16" : aspect === "1:1" ? "1:1" : "16:9",
      image: startUrl
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
      image: startUrl
    };
  }

  if (modelId === "google-veo-3-1") {
    const res = resolution.toLowerCase() === "1080p" ? "1080p" : "720p";
    return {
      model: atlasModel,
      prompt,
      aspect_ratio: aspect === "9:16" ? "9:16" : "16:9",
      resolution: res,
      duration: normalizeVeoDuration(duration, res),
      image: startUrl,
      generate_audio: false
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
      image: startUrl,
      generate_audio: false
    };
  }

  if (modelId === "hailuo-2-3") {
    return {
      model: atlasModel,
      prompt,
      duration: normalizeHailuoI2vDuration(duration),
      image: startUrl,
      enable_prompt_expansion: false
    };
  }

  if (modelId === "happyhorse-1") {
    return {
      model: atlasModel,
      prompt,
      aspect_ratio: aspect,
      resolution: resolution.toLowerCase() === "1080p" ? "1080P" : "720P",
      duration: Math.min(15, Math.max(3, duration)),
      fps: FPS,
      image: startUrl
    };
  }

  if (modelId === "wan-2-6") {
    return {
      model: atlasModel,
      prompt,
      aspect_ratio: aspect,
      resolution: resolution.toLowerCase() === "1080p" ? "1080p" : "720p",
      duration: Math.min(10, Math.max(2, duration)),
      fps: FPS,
      image: startUrl,
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
      fps: FPS,
      image: startUrl
    };
  }

  return {
    model: atlasModel,
    prompt,
    duration,
    fps: FPS,
    aspect_ratio: aspect,
    resolution: resolution.toLowerCase() === "1080p" ? "1080p" : "720p",
    image: startUrl
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
  throw new Error("Timed out waiting for Atlas");
}

async function atlasGenerateImage(apiKey, body) {
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
    throw new Error(createJson.message || createJson.error || `Atlas image failed (${createRes.status})`);
  }
  const predictionId = createJson?.data?.id;
  if (!predictionId) throw new Error("Atlas did not return prediction id");
  return pollUntilDone(apiKey, predictionId);
}

async function atlasGenerateVideo(apiKey, body) {
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
      createJson.message || createJson.error || `Atlas video failed (${createRes.status})`
    );
  }
  const predictionId = createJson?.data?.id;
  if (!predictionId) throw new Error("Atlas did not return prediction id");
  console.log(`[i2v-showcase] video submitted → ${predictionId}`);
  return pollUntilDone(apiKey, predictionId);
}

async function downloadFile(url, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  await writeFile(targetPath, Buffer.from(await res.arrayBuffer()));
}

function startFramePath(modelId) {
  return path.join(OUT_DIR, `${modelId}-start.png`);
}

function startFramePublicPath(modelId) {
  return `/video-showcases/i2v/${modelId}-start.png`;
}

async function fileExists(p) {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

async function isModelComplete(modelId, manifest) {
  const hasStart = await fileExists(startFramePath(modelId));
  const hasVideo = await fileExists(path.join(OUT_DIR, `${modelId}.mp4`));
  const entry = manifest.items?.[modelId];
  return hasStart && hasVideo && Boolean(entry?.startFramePrompt);
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
const forceStart = process.argv.includes("--force-start");

await mkdir(OUT_DIR, { recursive: true });

let manifest = { generatedAt: null, items: {} };
try {
  manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
} catch {
  /* fresh */
}

const entries = Object.entries(models).filter(([id]) => !onlySet || onlySet.has(id));

for (const [modelId, recipe] of entries) {
  const atlasModel = ATLAS_I2V_SLUG[modelId];
  if (!atlasModel) {
    console.warn(`[i2v-showcase] skip ${modelId}: no I2V slug`);
    continue;
  }

  const merged = mergeRecipe(modelId, recipe, defaults);
  if (!merged.startFramePrompt?.trim()) {
    console.warn(`[i2v-showcase] skip ${modelId}: missing startFramePrompt`);
    continue;
  }

  const startLocal = startFramePath(modelId);
  let startUrl = manifest.items?.[modelId]?.startFrameUrl;

  if (forceStart || !startUrl || !(await fileExists(startLocal))) {
    console.log(`[i2v-showcase] generating start frame for ${modelId}…`);
    try {
      startUrl = await atlasGenerateImage(apiKey, startFrameT2iBody(merged.startFramePrompt));
      await downloadFile(startUrl, startLocal);
      console.log(`[i2v-showcase] saved ${modelId}-start.png`);
    } catch (error) {
      console.error(`[i2v-showcase] failed start ${modelId}:`, error?.message || error);
      continue;
    }
  } else {
    console.log(`[i2v-showcase] reuse start frame ${modelId}`);
  }

  if (!onlySet && (await isModelComplete(modelId, manifest))) {
    console.log(`[i2v-showcase] skip ${modelId} (complete)`);
    continue;
  }

  console.log(`[i2v-showcase] generating video ${modelId}…`);
  try {
    const body = buildI2vBody(modelId, atlasModel, merged, startUrl);
    const outputUrl = await atlasGenerateVideo(apiKey, body);
    const videoFilename = `${modelId}.mp4`;
    await downloadFile(outputUrl, path.join(OUT_DIR, videoFilename));
    console.log(`[i2v-showcase] saved ${videoFilename}`);

    manifest.items = manifest.items ?? {};
    manifest.items[modelId] = {
      modelId,
      atlasModel,
      prompt: merged.prompt,
      startFramePrompt: merged.startFramePrompt,
      aspect: merged.aspect,
      resolution: merged.resolution,
      timeSeconds: merged.timeSeconds,
      startFramePath: startFramePublicPath(modelId),
      startFrameUrl: startUrl,
      publicPath: `/video-showcases/i2v/${videoFilename}`,
      atlasOutputUrl: outputUrl
    };
    manifest.generatedAt = new Date().toISOString();
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  } catch (error) {
    console.error(`[i2v-showcase] failed video ${modelId}:`, error?.message || error);
  }
}

console.log(
  `[i2v-showcase] done — ${Object.keys(manifest.items ?? {}).length}/${Object.keys(models).length} in manifest`
);
