/**
 * Generate 12 Seedance 2.0 T2V clips for the dashboard showcase grid.
 * Run: npm run generate:dashboard-seedance
 * Resume: npm run generate:dashboard-seedance -- --from=5
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const MODEL = "bytedance/seedance-2.0/text-to-video";
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "dashboard-assets", "seedance-showcase");
const MANIFEST_PATH = path.join(ROOT, "data", "dashboard-seedance-showcase.json");

const WIDTH = 752;
const HEIGHT = 1000;
const DURATION = 5;
const FPS = 24;

const CLIPS = [
  {
    id: "01",
    prompt:
      "Two cowboys sitting at a wooden saloon bar, dim amber light, cinematic western film, slow push-in, dust in the air, photorealistic."
  },
  {
    id: "02",
    prompt:
      "Pilot inside a futuristic cockpit surrounded by glowing blue holographic flight displays, cinematic sci-fi, subtle camera drift."
  },
  {
    id: "03",
    prompt:
      "A man and woman talking across a cafe table, warm window light, shallow depth of field, intimate cinematic dialogue scene."
  },
  {
    id: "04",
    prompt:
      "Massive ocean wave cresting under a dramatic golden sunset sky, slow motion water spray, epic nature cinematography."
  },
  {
    id: "05",
    prompt:
      "Busy city crosswalk with pedestrians and a yellow taxi, urban street photography style, handheld cinematic motion."
  },
  {
    id: "06",
    prompt:
      "Motorcyclist leaning hard into a highway turn, motion blur on the road, adrenaline sports cinematography, golden hour."
  },
  {
    id: "07",
    prompt:
      "Athlete sprinting on an outdoor track seen from behind, strong motion blur, dynamic sports film look, morning light."
  },
  {
    id: "08",
    prompt:
      "Sailboat with dark sails on calm sea directly beneath a bright sun, lens flare, serene cinematic seascape."
  },
  {
    id: "09",
    prompt:
      "Close-up of a dragon head formed from molten lava and glowing embers, fantasy VFX, fiery particles drifting upward."
  },
  {
    id: "10",
    prompt:
      "Young woman smiling in a bright modern kitchen, natural daylight, lifestyle commercial cinematography, gentle camera move."
  },
  {
    id: "11",
    prompt:
      "Medieval archer drawing a bowstring, intense close-up on hands and bow, gritty historical cinematic lighting."
  },
  {
    id: "12",
    prompt:
      "Astronaut floating through a vibrant colorful nebula in space, cosmic particles, awe-inspiring sci-fi cinematography."
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
  for (let i = 0; i < 180; i++) {
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
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  throw new Error("Timed out waiting for Atlas video");
}

async function downloadFile(url, targetPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const bytes = Buffer.from(await res.arrayBuffer());
  await writeFile(targetPath, bytes);
}

async function writeManifest(clips) {
  const manifest = {
    title: "Seedance 2.0",
    aspectRatio: "3/4",
    clips
  };
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function generateClip(apiKey, clip) {
  const prompt = `${clip.prompt}\n\nVertical 3:4 portrait video, tall mobile frame.`;
  const createRes = await fetch(`${ATLAS_BASE}/generateVideo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      width: WIDTH,
      height: HEIGHT,
      duration: DURATION,
      fps: FPS,
      aspect_ratio: "3:4",
      generate_audio: false
    })
  });

  const createJson = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createJson.message || createJson.error || `Atlas failed (${createRes.status})`);
  }

  const predictionId = createJson?.data?.id;
  if (!predictionId) throw new Error("Atlas did not return prediction id");

  console.log(`[seedance-showcase] ${clip.id} submitted → ${predictionId}`);
  const outputUrl = await pollUntilDone(apiKey, predictionId);
  const filename = `${clip.id}.mp4`;
  const target = path.join(OUT_DIR, filename);
  await downloadFile(outputUrl, target);
  console.log(`[seedance-showcase] saved public/dashboard-assets/seedance-showcase/${filename}`);

  return {
    id: clip.id,
    prompt: clip.prompt,
    src: `/dashboard-assets/seedance-showcase/${filename}`,
    href: "/video?tab=Text+to+Video&model=seedance-2&from=tools&name=Seedance+2.0+Text+to+Video"
  };
}

await loadEnvFiles();
const apiKey = process.env.ATLASCLOUD_API_KEY?.trim();
if (!apiKey) {
  throw new Error("Missing ATLASCLOUD_API_KEY in .env.local");
}

await mkdir(OUT_DIR, { recursive: true });

const fromArg = process.argv.find((arg) => arg.startsWith("--from="))?.slice("--from=".length);
const fromIndex = fromArg ? Math.max(0, Number(fromArg) - 1) : 0;

let existingClips = [];
try {
  const raw = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  if (Array.isArray(raw.clips)) existingClips = raw.clips;
} catch {
  // fresh run
}

const completedIds = new Set(existingClips.map((c) => c.id));
const clips = [...existingClips];

for (let i = fromIndex; i < CLIPS.length; i++) {
  const clip = CLIPS[i];
  if (completedIds.has(clip.id)) {
    console.log(`[seedance-showcase] skip ${clip.id} (already in manifest)`);
    continue;
  }

  console.log(`[seedance-showcase] generating ${clip.id}/${CLIPS.length}…`);
  try {
    const entry = await generateClip(apiKey, clip);
    clips.push(entry);
    clips.sort((a, b) => a.id.localeCompare(b.id));
    await writeManifest(clips);
  } catch (error) {
    console.error(`[seedance-showcase] failed ${clip.id}:`, error?.message || error);
    continue;
  }
}

console.log(`[seedance-showcase] done — ${clips.length}/${CLIPS.length} clips in manifest`);
