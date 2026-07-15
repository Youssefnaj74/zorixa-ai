/**
 * Generate Image-to-Image showcase assets via Atlas Cloud.
 *
 * 1. Shared reference portrait (T2I)
 * 2. Shared style mood plate (T2I)
 * 3. Per-model edit output (I2I) using the same refs + recipe prompt
 *
 * Requires ATLASCLOUD_API_KEY in .env.local
 * Usage:
 *   node scripts/generate-i2i-showcases.mjs
 *   node scripts/generate-i2i-showcases.mjs --only=gpt-image-2
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, "public", "image-showcases", "i2i");
const RECIPES_PATH = path.join(ROOT, "data", "image-i2i-showcase-recipes.json");

/** Composer id → Atlas edit slug */
const EDIT_MODELS = {
  "gpt-image-2": "openai/gpt-image-2/edit",
  "nano-banana-2": "google/nano-banana-2/edit",
  "nano-banana-pro": "google/nano-banana-pro/edit",
  zorixa: "qwen/qwen-image-2.0-pro/edit",
  "seedream-5": "bytedance/seedream-v5.0-lite/edit",
  "seedream-5-pro": "bytedance/seedream-v5.0-pro/edit",
  "grok-imagine": "xai/grok-imagine-image-quality/edit",
  "flux-kontext-dev": "black-forest-labs/flux-kontext-dev",
  "flux-kontext-dev-lora": "black-forest-labs/flux-kontext-dev-lora",
  "wan-image-2-7": "alibaba/wan-2.7/image-edit",
  "wan-image-2-7-pro": "alibaba/wan-2.7-pro/image-edit",
  "wan-image-2-6": "alibaba/wan-2.6/image-edit"
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

function t2iBody(prompt) {
  return {
    model: "openai/gpt-image-2/text-to-image",
    prompt,
    size: "1024x1536",
    quality: "low"
  };
}

function editImageUrlsForModel(modelId, refUrl, styleUrl) {
  if (modelId === "gpt-image-2") return [refUrl, styleUrl];
  return [refUrl];
}

function editBody(atlasModel, prompt, imageUrls) {
  const primary = imageUrls[0];
  if (atlasModel.includes("gpt-image-2")) {
    return {
      model: atlasModel,
      prompt,
      image: primary,
      images: imageUrls,
      size: "1536x1024",
      quality: "low"
    };
  }
  if (atlasModel.includes("seedream")) {
    return {
      model: atlasModel,
      prompt,
      image: primary,
      images: imageUrls,
      size: "1728*2304"
    };
  }
  if (/black-forest-labs\/flux|alibaba\/wan/i.test(atlasModel)) {
    return {
      model: atlasModel,
      prompt,
      image: primary,
      images: imageUrls,
      image_url: primary,
      width: 1024,
      height: 1536
    };
  }
  return {
    model: atlasModel,
    prompt,
    image: primary,
    images: imageUrls,
    image_urls: imageUrls,
    width: 1024,
    height: 1536
  };
}

async function atlasGenerate(apiKey, body) {
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
    throw new Error(createJson.message || createJson.error || `Atlas failed (${createRes.status})`);
  }

  const predictionId = createJson?.data?.id;
  if (!predictionId) throw new Error("Atlas did not return prediction id");

  for (let i = 0; i < 90; i++) {
    const pollRes = await fetch(`${ATLAS_BASE}/prediction/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const pollJson = await pollRes.json();
    if (!pollRes.ok) {
      throw new Error(pollJson.message || `Poll failed (${pollRes.status})`);
    }

    const status = String(pollJson?.data?.status || "").toLowerCase();
    const outputUrl = firstUrl(pollJson?.data?.outputs) || firstUrl(pollJson?.data?.output);
    if (outputUrl && ["completed", "succeeded", "success"].includes(status)) {
      return outputUrl;
    }
    if (status === "failed") {
      throw new Error(pollJson?.data?.error || pollJson.message || "Prediction failed");
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error("Timed out waiting for Atlas output");
}

async function downloadImage(url, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  await writeFile(targetPath, Buffer.from(await res.arrayBuffer()));
}

await loadEnvFiles();
const apiKey = process.env.ATLASCLOUD_API_KEY?.trim();
if (!apiKey) {
  throw new Error("Missing ATLASCLOUD_API_KEY in .env.local");
}

const recipes = JSON.parse(await readFile(RECIPES_PATH, "utf8"));
const only = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);

const sharedDir = path.join(OUT_ROOT, "_shared");
const refPath = path.join(sharedDir, "reference.png");
const stylePath = path.join(sharedDir, "style.png");
const manifestPath = path.join(sharedDir, "manifest.json");

let refUrl;
let styleUrl;
const forceShared = process.argv.includes("--shared");

async function fileExists(p) {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

if (!forceShared && (await fileExists(manifestPath))) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  refUrl = manifest.referenceUrl;
  styleUrl = manifest.styleUrl;
  console.log("[i2i-showcases] reusing Atlas URLs from _shared/manifest.json");
} else {
  console.log("[i2i-showcases] generating shared reference portrait…");
  refUrl = await atlasGenerate(apiKey, t2iBody(recipes.shared.referencePrompt));
  await downloadImage(refUrl, refPath);
  console.log("[i2i-showcases] saved _shared/reference.png");

  console.log("[i2i-showcases] generating shared style plate…");
  styleUrl = await atlasGenerate(apiKey, t2iBody(recipes.shared.stylePrompt));
  await downloadImage(styleUrl, stylePath);
  console.log("[i2i-showcases] saved _shared/style.png");

  await writeFile(
    manifestPath,
    JSON.stringify({ referenceUrl: refUrl, styleUrl: styleUrl }, null, 2)
  );
}

for (const [modelId, recipe] of Object.entries(recipes.models)) {
  if (only && only !== modelId) continue;
  const atlasEdit = EDIT_MODELS[modelId];
  if (!atlasEdit) {
    console.warn(`[i2i-showcases] skip ${modelId}: no edit slug`);
    continue;
  }

  const imageUrls = editImageUrlsForModel(modelId, refUrl, styleUrl);
  const outPath = path.join(OUT_ROOT, modelId, "output.png");
  console.log(`[i2i-showcases] editing ${modelId}…`);
  try {
    const outputUrl = await atlasGenerate(apiKey, editBody(atlasEdit, recipe.editPrompt, imageUrls));
    await downloadImage(outputUrl, outPath);
    console.log(`[i2i-showcases] saved i2i/${modelId}/output.png`);
  } catch (error) {
    console.error(`[i2i-showcases] failed ${modelId}: ${error?.message || error}`);
  }
}

console.log("[i2i-showcases] done");
