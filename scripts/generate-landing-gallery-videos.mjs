/**
 * Generate 9:16 landing gallery videos via Atlas Cloud (I2V from landing-gallery PNGs).
 *
 * Output: public/landing-gallery/{id}/video.mp4
 * Recipes: data/landing-gallery-video-recipes.json
 *
 * Usage:
 *   npm run generate:landing-gallery-videos
 *   npm run generate:landing-gallery-videos -- --only=ugc
 *
 * Requires ATLASCLOUD_API_KEY + Supabase uploads bucket (for public start-frame URLs).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, "public", "landing-gallery");
const RECIPES_PATH = path.join(ROOT, "data", "landing-gallery-video-recipes.json");
const MANIFEST_PATH = path.join(OUT_ROOT, "videos-manifest.json");
const FPS = 24;

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

function normalizeHailuoI2vDuration(seconds) {
  const s = Math.min(10, Math.max(6, Math.round(seconds)));
  return [6, 10].reduce((best, opt) => (Math.abs(opt - s) < Math.abs(best - s) ? opt : best));
}

function normalizeVeoDuration(seconds, resolution) {
  const res = resolution.toLowerCase() === "1080p" ? "1080p" : "720p";
  if (res === "1080p") return 8;
  if (seconds <= 5) return 4;
  if (seconds <= 7) return 6;
  return 8;
}

function buildI2vBody(recipe, startUrl) {
  const { modelId, atlasModel, prompt, aspect = "9:16", resolution = "720p", duration = 5 } = recipe;

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

  if (modelId === "hailuo-2-3") {
    return {
      model: atlasModel,
      prompt,
      duration: normalizeHailuoI2vDuration(duration),
      image: startUrl,
      enable_prompt_expansion: false
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

async function uploadLocalImage(localPath) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const bytes = await readFile(localPath);
  const objectPath = `landing-gallery-temp/${crypto.randomUUID()}.png`;
  const { error } = await supabase.storage.from("uploads").upload(objectPath, bytes, {
    contentType: "image/png",
    upsert: false
  });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  return supabase.storage.from("uploads").getPublicUrl(objectPath).data.publicUrl;
}

async function pollUntilDone(apiKey, predictionId) {
  for (let i = 0; i < 240; i++) {
    const pollRes = await fetch(`${ATLAS_BASE}/prediction/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store"
    });
    const pollJson = await pollRes.json();
    if (!pollRes.ok) throw new Error(pollJson.message || `Poll failed (${pollRes.status})`);

    const status = String(pollJson?.data?.status || "").toLowerCase();
    const outputUrl =
      firstUrl(pollJson?.data?.outputs) || firstUrl(pollJson?.data?.output);
    if (outputUrl && ["completed", "succeeded", "success"].includes(status)) return outputUrl;
    if (status === "failed") {
      throw new Error(
        pollJson?.data?.error || pollJson?.data?.logs || pollJson.message || "Prediction failed"
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error("Timed out waiting for Atlas video");
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
    throw new Error(createJson.message || createJson.error || `Atlas video failed (${createRes.status})`);
  }
  const predictionId = createJson?.data?.id;
  if (!predictionId) throw new Error("Atlas did not return prediction id");
  console.log(`  video submitted → ${predictionId}`);
  return pollUntilDone(apiKey, predictionId);
}

async function downloadFile(url, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  await writeFile(targetPath, Buffer.from(await res.arrayBuffer()));
}

async function fileExists(p) {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

async function generateOne(apiKey, id, recipe, defaults, force) {
  const videoPath = path.join(OUT_ROOT, id, "video.mp4");
  const startLocal = path.join(OUT_ROOT, recipe.startFramePath);

  if (!force && (await fileExists(videoPath))) {
    console.log(`[landing-gallery-videos] skip ${id} (video exists)`);
    return {
      id,
      category: recipe.category,
      label: recipe.label,
      modelId: recipe.modelId,
      poster: `/landing-gallery/${recipe.startFramePath}`,
      src: `/landing-gallery/${id}/video.mp4`,
      skipped: true
    };
  }

  if (!(await fileExists(startLocal))) {
    throw new Error(`Missing start frame: public/landing-gallery/${recipe.startFramePath}`);
  }

  console.log(`[landing-gallery-videos] ${id} — uploading start frame…`);
  const startUrl = await uploadLocalImage(startLocal);

  const merged = { ...defaults, ...recipe };
  console.log(`[landing-gallery-videos] ${id} — generating I2V (${recipe.atlasModel})…`);
  const outputUrl = await atlasGenerateVideo(apiKey, buildI2vBody(merged, startUrl));
  await downloadFile(outputUrl, videoPath);
  console.log(`[landing-gallery-videos] saved landing-gallery/${id}/video.mp4`);

  return {
    id,
    category: recipe.category,
    label: recipe.label,
    modelId: recipe.modelId,
    poster: `/landing-gallery/${recipe.startFramePath}`,
    src: `/landing-gallery/${id}/video.mp4`,
    startFrameUrl: startUrl,
    atlasOutputUrl: outputUrl
  };
}

await loadEnvFiles();
const apiKey = process.env.ATLASCLOUD_API_KEY?.trim();
if (!apiKey) throw new Error("Missing ATLASCLOUD_API_KEY in .env.local");

const recipesFile = JSON.parse(await readFile(RECIPES_PATH, "utf8"));
const defaults = recipesFile.defaults;
const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const onlySet = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;
const force = process.argv.includes("--force");

let prior = { videos: {} };
try {
  prior = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
} catch {
  /* fresh */
}

const manifest = {
  generatedAt: new Date().toISOString(),
  videos: { ...prior.videos }
};

for (const [id, recipe] of Object.entries(recipesFile.videos)) {
  if (onlySet && !onlySet.has(id)) continue;
  try {
    manifest.videos[id] = await generateOne(apiKey, id, recipe, defaults, force);
  } catch (error) {
    console.error(`[landing-gallery-videos] failed ${id}:`, error?.message || error);
    manifest.videos[id] = { id, error: String(error?.message || error) };
  }
}

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log("[landing-gallery-videos] manifest → public/landing-gallery/videos-manifest.json");
console.log(
  `[landing-gallery-videos] done — ${Object.values(manifest.videos).filter((v) => !v.error && !v.skipped).length} generated`
);
