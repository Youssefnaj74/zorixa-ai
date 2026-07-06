/**
 * Image Upscaler studio example — one Atlas UGC face, downscaled before + upscaled after.
 *
 * Output: public/image-showcases/upscaler/before.png + after.png (+ source.png)
 *
 * Usage:
 *   npm run generate:image-upscaler-showcase
 *   npm run generate:image-upscaler-showcase -- --force
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "image-showcases", "upscaler");
const RECIPE_PATH = path.join(ROOT, "data", "image-upscaler-showcase-recipe.json");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");

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

function buildT2iBody(recipe) {
  return {
    model: recipe.model,
    prompt: recipe.prompt,
    resolution: recipe.resolution ?? "2k",
    aspect_ratio: recipe.aspect_ratio ?? "3:4"
  };
}

function buildUpscaleBody(imageUrl, upscaleRecipe) {
  return {
    model: upscaleRecipe.model ?? "atlascloud/image-upscaler",
    image: imageUrl,
    outscale: upscaleRecipe.outscale ?? 4,
    output_format: upscaleRecipe.output_format ?? "png"
  };
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
  throw new Error("Timed out waiting for Atlas");
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
  console.log(`  submitted → ${predictionId}`);
  return pollUntilDone(apiKey, predictionId);
}

async function downloadBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function writePngBuffer(targetPath, bytes) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, bytes);
}

async function fileExists(p) {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

async function uploadLocalBytes(bytes, suffix = "png") {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required to upscale local before.png"
    );
  }

  const objectPath = `image-upscaler-showcase/${crypto.randomUUID()}.${suffix}`;
  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/uploads/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "image/png",
      "x-upsert": "false"
    },
    body: bytes
  });
  if (!uploadRes.ok) {
    const detail = await uploadRes.text().catch(() => "");
    throw new Error(`Supabase upload failed (${uploadRes.status})${detail ? `: ${detail}` : ""}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/uploads/${objectPath}`;
}

async function uploadLocalImage(localPath) {
  return uploadLocalBytes(await readFile(localPath));
}

async function buildBeforeFromSource(sourceBytes, beforeRecipe) {
  const maxWidth = beforeRecipe?.maxWidth ?? 360;
  const blurSigma = beforeRecipe?.blurSigma ?? 0.6;
  let pipeline = sharp(sourceBytes).resize(maxWidth, null, {
    fit: "inside",
    withoutEnlargement: true,
    kernel: "lanczos3"
  });
  if (blurSigma > 0) {
    pipeline = pipeline.blur(blurSigma);
  }
  return pipeline.png().toBuffer();
}

await loadEnvFiles();
const apiKey = process.env.ATLASCLOUD_API_KEY?.trim();
if (!apiKey) {
  throw new Error("Missing ATLASCLOUD_API_KEY in .env.local");
}

const force = process.argv.includes("--force");
const recipe = JSON.parse(await readFile(RECIPE_PATH, "utf8"));
const sourcePath = path.join(OUT_DIR, "source.png");
const beforePath = path.join(OUT_DIR, "before.png");
const afterPath = path.join(OUT_DIR, "after.png");

if (!force && (await fileExists(beforePath)) && (await fileExists(afterPath))) {
  console.log("[image-upscaler-showcase] skip (files exist, use --force)");
  process.exit(0);
}

let sourceAtlasUrl = null;
let sourceBytes = null;

if (force || !(await fileExists(sourcePath))) {
  console.log("[image-upscaler-showcase] generating source UGC face…");
  sourceAtlasUrl = await atlasGenerate(apiKey, buildT2iBody(recipe.source));
  sourceBytes = await downloadBytes(sourceAtlasUrl);
  await writePngBuffer(sourcePath, sourceBytes);
  console.log("[image-upscaler-showcase] saved source.png");
} else {
  sourceBytes = await readFile(sourcePath);
}

console.log("[image-upscaler-showcase] building before.png (downscale same image)…");
const beforeBytes = await buildBeforeFromSource(sourceBytes, recipe.before);
await writePngBuffer(beforePath, beforeBytes);

const inputUrl = await uploadLocalBytes(beforeBytes);
console.log("[image-upscaler-showcase] upscaling with atlascloud/image-upscaler…");
const afterAtlasUrl = await atlasGenerate(apiKey, buildUpscaleBody(inputUrl, recipe.upscale));
const afterBytes = await downloadBytes(afterAtlasUrl);
await writePngBuffer(afterPath, afterBytes);

const manifest = {
  generatedAt: new Date().toISOString(),
  beforePath: "/image-showcases/upscaler/before.png",
  afterPath: "/image-showcases/upscaler/after.png",
  sourcePath: "/image-showcases/upscaler/source.png",
  sourceAtlasUrl,
  beforeAtlasUrl: inputUrl,
  afterAtlasUrl,
  sourceModel: recipe.source.model,
  upscaleModel: recipe.upscale.model,
  outscale: recipe.upscale.outscale,
  beforeMaxWidth: recipe.before?.maxWidth ?? 360
};
await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log("[image-upscaler-showcase] done — same face, before (low-res) vs after (4×)");
