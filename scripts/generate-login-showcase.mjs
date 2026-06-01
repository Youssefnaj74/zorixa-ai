/**
 * Generate login page hero images via Atlas Cloud (distinct from dashboard assets).
 * Run: npm run generate:login-showcase
 * Resume one: npm run generate:login-showcase -- --only=seedance-2
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const ATLAS_MODEL = "openai/gpt-image-2/text-to-image";
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "login-assets");
const MANIFEST_PATH = path.join(ROOT, "data", "login-showcase.json");

const SLIDES = [
  {
    id: "seedance-2",
    title: "Seedance 2.0",
    tagline: "Cinematic motion from text and stills — Atlas Cloud on Zorixa.",
    badge: "VIDEO",
    prompt: [
      "Ultra cinematic night street scene for an AI video platform hero image.",
      "A vintage dark muscle car parked under a warm street lamp on wet asphalt, headlights cutting through light rain and mist.",
      "Moody film noir color grade, shallow depth of field, anamorphic lens flare, subtle motion blur on raindrops.",
      "No text, no logo, no watermark, no UI overlays, no dashboard mockups.",
      "Photorealistic, premium advertising photography, 16:10 landscape composition with dark negative space on the left third for text overlay."
    ].join(" ")
  },
  {
    id: "cinema-ai",
    title: "Cinema AI",
    tagline: "Storyboard scenes, film frames, and dramatic campaign visuals.",
    badge: "CINEMA",
    prompt: [
      "Ultra cinematic empty film set hero image for an AI cinema studio.",
      "Large cinema camera on a dolly track facing a dramatic spotlight beam cutting through haze, velvet curtains in the background.",
      "Rich contrast, teal and amber theatrical lighting, dust particles in the air, Hollywood production atmosphere.",
      "No text, no logo, no watermark, no UI overlays, no dashboard mockups.",
      "Photorealistic, premium film still, 16:10 landscape with darker left side for headline overlay."
    ].join(" ")
  },
  {
    id: "freelance-ai",
    title: "Freelance AI",
    tagline: "Client-ready stills, brand boards, and social assets in minutes.",
    badge: "IMAGE",
    prompt: [
      "Premium creative freelancer workspace hero image for an AI image studio.",
      "Minimal dark desk with a glowing tablet showing abstract colorful artwork, color swatch cards, a camera lens, and soft cyan and violet ambient light.",
      "Clean editorial styling, shallow depth of field, luxury creative agency mood.",
      "No text, no logo, no watermark, no UI overlays, no floating dashboard cards.",
      "Photorealistic product photography, 16:10 landscape with calm darker left area for text overlay."
    ].join(" ")
  },
  {
    id: "ugc-video",
    title: "UGC Video",
    tagline: "Creator ads, product demos, and vertical social-first clips.",
    badge: "UGC",
    prompt: [
      "Authentic UGC creator filming hero image for an AI video platform.",
      "Young woman in a cozy home studio holding a skincare product toward a ring light and smartphone on a tripod, warm natural smile, soft bokeh background.",
      "Bright but cinematic lifestyle lighting, social-first creator energy, vertical-phone framing implied without showing UI.",
      "No text, no logo, no watermark, no app interface, no dashboard mockups.",
      "Photorealistic commercial photography, 16:10 landscape with softer darker left side for headline overlay."
    ].join(" ")
  }
];

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
      // optional
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

async function generateImage(apiKey, slide) {
  const createRes = await fetch(`${ATLAS_BASE}/generateImage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: ATLAS_MODEL,
      prompt: slide.prompt,
      size: "1536x1024",
      quality: "medium"
    })
  });
  const createJson = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createJson.message || createJson.error || `Atlas failed (${createRes.status})`);
  }

  const predictionId = createJson?.data?.id;
  if (!predictionId) throw new Error("Atlas did not return prediction id");

  console.log(`[login-showcase] ${slide.id} submitted → ${predictionId}`);
  return pollUntilDone(apiKey, predictionId);
}

async function downloadImage(url, targetPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  await writeFile(targetPath, Buffer.from(await res.arrayBuffer()));
}

async function writeManifest(slides) {
  await writeFile(MANIFEST_PATH, `${JSON.stringify({ slides }, null, 2)}\n`, "utf8");
}

await loadEnvFiles();
const apiKey = process.env.ATLASCLOUD_API_KEY?.trim();
if (!apiKey) {
  throw new Error("Missing ATLASCLOUD_API_KEY in .env.local");
}

await mkdir(OUT_DIR, { recursive: true });

const onlyArg = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

let existingSlides = [];
try {
  const raw = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  if (Array.isArray(raw.slides)) existingSlides = raw.slides;
} catch {
  // fresh run
}

const completedIds = new Set(existingSlides.map((s) => s.id));
const slides = [...existingSlides];

for (const slide of SLIDES) {
  if (onlyArg && slide.id !== onlyArg) continue;
  if (completedIds.has(slide.id)) {
    console.log(`[login-showcase] skip ${slide.id} (already in manifest)`);
    continue;
  }

  console.log(`[login-showcase] generating ${slide.id}…`);
  try {
    const outputUrl = await generateImage(apiKey, slide);
    const filename = `${slide.id}.png`;
    const target = path.join(OUT_DIR, filename);
    await downloadImage(outputUrl, target);
    console.log(`[login-showcase] saved public/login-assets/${filename}`);

    slides.push({
      id: slide.id,
      title: slide.title,
      tagline: slide.tagline,
      badge: slide.badge,
      image: `/login-assets/${filename}`
    });
    slides.sort((a, b) => SLIDES.findIndex((s) => s.id === a.id) - SLIDES.findIndex((s) => s.id === b.id));
    await writeManifest(slides);
  } catch (error) {
    console.error(`[login-showcase] failed ${slide.id}:`, error?.message || error);
  }
}

console.log(`[login-showcase] done — ${slides.length}/${SLIDES.length} slides in manifest`);
