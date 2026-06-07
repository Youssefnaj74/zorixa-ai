/**
 * Generate landing-page Before/After gallery assets via Atlas Cloud.
 *
 * Output: public/landing-gallery/{pairId}/before.png + after.png
 * Recipes: data/landing-gallery-before-after-recipes.json
 *
 * Usage:
 *   npm run generate:landing-gallery
 *   npm run generate:landing-gallery -- --only=ugc
 *   npm run generate:landing-gallery -- --force
 *   npm run generate:landing-gallery -- --only=ugc --after-only
 *
 * Requires ATLASCLOUD_API_KEY in .env.local
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, "public", "landing-gallery");
const RECIPES_PATH = path.join(ROOT, "data", "landing-gallery-before-after-recipes.json");
const MANIFEST_PATH = path.join(OUT_ROOT, "manifest.json");

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

function portraitSize() {
  return { width: 1024, height: 1365 };
}

function buildT2iBody(model, prompt) {
  const { width, height } = portraitSize();
  if (/google\/nano-banana/i.test(model)) {
    return {
      model,
      prompt,
      resolution: "2k",
      aspect_ratio: "3:4"
    };
  }
  if (/black-forest-labs\/flux|alibaba\/wan/i.test(model)) {
    return { model, prompt, width, height };
  }
  return {
    model,
    prompt,
    size: "1024x1536",
    quality: "medium"
  };
}

function buildEditBody(model, prompt, imageUrl) {
  const { width, height } = portraitSize();
  if (/google\/nano-banana/i.test(model)) {
    return {
      model,
      prompt,
      image: imageUrl,
      image_url: imageUrl,
      images: [imageUrl],
      image_urls: [imageUrl],
      resolution: "2k",
      aspect_ratio: "3:4"
    };
  }
  return {
    model,
    prompt,
    image: imageUrl,
    image_url: imageUrl,
    images: [imageUrl],
    width,
    height
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
  throw new Error("Timed out waiting for Atlas image");
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

async function downloadImage(url, targetPath) {
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

async function uploadLocalImageForEdit(localPath) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for --after-only when beforeAtlasUrl is not in manifest"
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const bytes = await readFile(localPath);
  const objectPath = `landing-gallery-temp/${crypto.randomUUID()}.png`;
  const { error } = await supabase.storage.from("uploads").upload(objectPath, bytes, {
    contentType: "image/png",
    upsert: false
  });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from("uploads").getPublicUrl(objectPath);
  return data.publicUrl;
}

async function resolveBeforeAtlasUrl(pairId, beforePath, priorEntry) {
  if (priorEntry?.beforeAtlasUrl) return priorEntry.beforeAtlasUrl;
  return uploadLocalImageForEdit(beforePath);
}

async function generatePair(apiKey, pairId, pairRecipe, { force, afterOnly, priorEntry }) {
  const pairDir = path.join(OUT_ROOT, pairId);
  const beforePath = path.join(pairDir, "before.png");
  const afterPath = path.join(pairDir, "after.png");
  const hasBefore = await fileExists(beforePath);
  const hasAfter = await fileExists(afterPath);

  if (!afterOnly && !force && hasBefore && hasAfter) {
    console.log(`[landing-gallery] skip ${pairId} (files exist)`);
    return {
      id: pairId,
      category: pairRecipe.category,
      beforePath: `/landing-gallery/${pairId}/before.png`,
      afterPath: `/landing-gallery/${pairId}/after.png`,
      beforeAtlasUrl: priorEntry?.beforeAtlasUrl,
      afterAtlasUrl: priorEntry?.afterAtlasUrl,
      skipped: true
    };
  }

  let beforeUrl = priorEntry?.beforeAtlasUrl ?? null;

  if (afterOnly) {
    if (!hasBefore) throw new Error(`${pairId}: before.png missing — cannot use --after-only`);
    beforeUrl = await resolveBeforeAtlasUrl(pairId, beforePath, priorEntry);
    console.log(`[landing-gallery] ${pairId} — reusing before.png`);
  } else if (force || !hasBefore) {
    console.log(`[landing-gallery] ${pairId} — before (${pairRecipe.before.model})…`);
    beforeUrl = await atlasGenerate(apiKey, buildT2iBody(pairRecipe.before.model, pairRecipe.before.prompt));
    await downloadImage(beforeUrl, beforePath);
    console.log(`[landing-gallery] saved landing-gallery/${pairId}/before.png`);
  } else if (!beforeUrl) {
    beforeUrl = await resolveBeforeAtlasUrl(pairId, beforePath, priorEntry);
  }

  const afterIsEdit = pairRecipe.after.model.includes("/edit");
  console.log(
    `[landing-gallery] ${pairId} — after (${pairRecipe.after.model})${afterIsEdit ? " [i2i from before]" : ""}…`
  );
  const afterBody = afterIsEdit
    ? buildEditBody(pairRecipe.after.model, pairRecipe.after.prompt, beforeUrl)
    : buildT2iBody(pairRecipe.after.model, pairRecipe.after.prompt);
  const afterUrl = await atlasGenerate(apiKey, afterBody);
  await downloadImage(afterUrl, afterPath);
  console.log(`[landing-gallery] saved landing-gallery/${pairId}/after.png`);

  return {
    id: pairId,
    category: pairRecipe.category,
    beforePath: `/landing-gallery/${pairId}/before.png`,
    afterPath: `/landing-gallery/${pairId}/after.png`,
    beforeAtlasUrl: beforeUrl,
    afterAtlasUrl: afterUrl,
    beforeModel: pairRecipe.before.model,
    afterModel: pairRecipe.after.model
  };
}

await loadEnvFiles();
const apiKey = process.env.ATLASCLOUD_API_KEY?.trim();
if (!apiKey) {
  throw new Error("Missing ATLASCLOUD_API_KEY in .env.local");
}

const recipes = JSON.parse(await readFile(RECIPES_PATH, "utf8"));
const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const onlySet = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;
const force = process.argv.includes("--force");
const afterOnly = process.argv.includes("--after-only");

await mkdir(OUT_ROOT, { recursive: true });

let priorManifest = { pairs: {} };
try {
  priorManifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
} catch {
  /* fresh */
}

const manifest = {
  generatedAt: new Date().toISOString(),
  pairs: { ...priorManifest.pairs }
};

for (const [pairId, pairRecipe] of Object.entries(recipes.pairs)) {
  if (onlySet && !onlySet.has(pairId)) continue;
  try {
    manifest.pairs[pairId] = await generatePair(apiKey, pairId, pairRecipe, {
      force,
      afterOnly,
      priorEntry: priorManifest.pairs?.[pairId]
    });
  } catch (error) {
    console.error(`[landing-gallery] failed ${pairId}:`, error?.message || error);
    manifest.pairs[pairId] = { id: pairId, error: String(error?.message || error) };
  }
}

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`[landing-gallery] manifest → public/landing-gallery/manifest.json`);
console.log(
  `[landing-gallery] done — ${Object.values(manifest.pairs).filter((p) => !p.error && !p.skipped).length} generated`
);
