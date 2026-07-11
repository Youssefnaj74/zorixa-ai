/**
 * Copy Video-to-Video showcase assets from .tmp into public/video-showcases/v2v.
 *
 * Standard drop folder per model:
 *   .tmp/v2v/<modelId>/character.png   (or .jpg / .webp)
 *   .tmp/v2v/<modelId>/motion.mp4      (reference motion clip)
 *   .tmp/v2v/<modelId>/output.mp4
 *
 * Legacy: `.tmp/a2v/Kling 2.6 Motion/` (png + 2 mp4s) → kling-2-6-motion
 *
 * Usage: npm run ingest:v2v-showcase
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP_DIR = path.join(ROOT, ".tmp", "v2v");
const OUT_DIR = path.join(ROOT, "public", "video-showcases", "v2v");

const CHARACTER_NAMES = [
  "character.png",
  "character.jpg",
  "character.jpeg",
  "character.webp",
  "image.png",
  "portrait.png"
];
const MOTION_NAMES = ["motion.mp4", "motion-clip.mp4", "reference.mp4"];
const OUTPUT_NAMES = ["output.mp4", "video.mp4", "zorixa-video.mp4"];

/** modelId → optional legacy folder (under .tmp/a2v) when .tmp/v2v/<id> is missing */
const LEGACY_A2V_FOLDERS = {
  "kling-2-6-motion": path.join(ROOT, ".tmp", "a2v", "Kling 2.6 Motion")
};

async function findFirst(dir, names) {
  for (const name of names) {
    const full = path.join(dir, name);
    try {
      await fs.access(full);
      return full;
    } catch {
      // try next
    }
  }
  return null;
}

async function findByExtension(dir, ext) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  const files = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(ext)).map((e) => e.name);
  if (files.length === 0) return null;
  return path.join(dir, files[0]);
}

async function findLargestMp4(dir, exclude) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  const mp4s = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".mp4"));
  if (mp4s.length === 0) return null;
  if (mp4s.length === 1) return path.join(dir, mp4s[0].name);

  let best = null;
  let bestSize = -1;
  for (const e of mp4s) {
    const full = path.join(dir, e.name);
    if (exclude && full === exclude) continue;
    const stat = await fs.stat(full);
    if (stat.size > bestSize) {
      bestSize = stat.size;
      best = full;
    }
  }
  return best;
}

async function resolveLegacyAssets(legacyDir) {
  const characterSrc =
    (await findFirst(legacyDir, CHARACTER_NAMES)) || (await findByExtension(legacyDir, ".png"));
  const outputSrc =
    (await findFirst(legacyDir, OUTPUT_NAMES)) || (await findLargestMp4(legacyDir, null));
  let motionSrc = await findFirst(legacyDir, MOTION_NAMES);
  if (!motionSrc && outputSrc) {
    motionSrc = await findLargestMp4(legacyDir, outputSrc);
    if (motionSrc === outputSrc) motionSrc = null;
  }
  if (!motionSrc) {
    const mp4s = [];
    try {
      const entries = await fs.readdir(legacyDir, { withFileTypes: true });
      for (const e of entries.filter((x) => x.isFile() && x.name.toLowerCase().endsWith(".mp4"))) {
        mp4s.push(path.join(legacyDir, e.name));
      }
    } catch {
      /* ignore */
    }
    if (mp4s.length >= 2) {
      const sized = await Promise.all(
        mp4s.map(async (p) => ({ p, size: (await fs.stat(p)).size }))
      );
      sized.sort((a, b) => a.size - b.size);
      motionSrc = sized[0].p;
      if (!outputSrc) {
        return { characterSrc, motionSrc, videoSrc: sized[sized.length - 1].p };
      }
    }
  }
  return { characterSrc, motionSrc, videoSrc: outputSrc };
}

async function resolveModelAssets(modelId) {
  const srcDir = path.join(TMP_DIR, modelId);
  let characterSrc = await findFirst(srcDir, CHARACTER_NAMES);
  let motionSrc = await findFirst(srcDir, MOTION_NAMES);
  let videoSrc = await findFirst(srcDir, OUTPUT_NAMES);

  if (characterSrc && motionSrc && videoSrc) {
    return { characterSrc, motionSrc, videoSrc };
  }

  const legacyDir = LEGACY_A2V_FOLDERS[modelId];
  if (!legacyDir) return { characterSrc, motionSrc, videoSrc };

  try {
    await fs.access(legacyDir);
  } catch {
    return { characterSrc, motionSrc, videoSrc };
  }

  return resolveLegacyAssets(legacyDir);
}

async function ingestModel(modelId) {
  const { characterSrc, motionSrc, videoSrc } = await resolveModelAssets(modelId);

  if (!characterSrc || !motionSrc || !videoSrc) {
    const missing = [
      !characterSrc ? "character image" : null,
      !motionSrc ? "motion.mp4" : null,
      !videoSrc ? "output.mp4" : null
    ].filter(Boolean);
    console.warn(`[ingest-v2v-showcase] skip ${modelId} — missing: ${missing.join(", ")}`);
    return false;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const characterOut = path.join(OUT_DIR, `${modelId}-character.png`);
  const motionOut = path.join(OUT_DIR, `${modelId}-motion.mp4`);
  const videoOut = path.join(OUT_DIR, `${modelId}.mp4`);

  await sharp(characterSrc).png({ compressionLevel: 9 }).toFile(characterOut);
  await fs.copyFile(motionSrc, motionOut);
  await fs.copyFile(videoSrc, videoOut);

  const webpOut = path.join(OUT_DIR, `${modelId}-character.webp`);
  const avifOut = path.join(OUT_DIR, `${modelId}-character.avif`);
  await sharp(characterOut).webp({ quality: 86, effort: 4 }).toFile(webpOut);
  await sharp(characterOut).avif({ quality: 72, effort: 4 }).toFile(avifOut);

  console.log(`[ingest-v2v-showcase] ok ${modelId}`);
  return true;
}

async function main() {
  const fromArgv = process.argv.slice(2).filter(Boolean);
  let modelIds = fromArgv;

  if (modelIds.length === 0) {
    const discovered = new Set(Object.keys(LEGACY_A2V_FOLDERS));
    try {
      const entries = await fs.readdir(TMP_DIR, { withFileTypes: true });
      for (const e of entries.filter((x) => x.isDirectory())) discovered.add(e.name);
    } catch {
      /* .tmp/v2v may not exist yet */
    }
    modelIds = [...discovered];
  }

  if (modelIds.length === 0) {
    console.error(`[ingest-v2v-showcase] add folders under ${TMP_DIR} or legacy a2v/Kling 2.6 Motion`);
    process.exit(1);
  }

  let ok = 0;
  for (const modelId of modelIds) {
    if (await ingestModel(modelId)) ok += 1;
  }

  if (ok === 0) process.exit(1);
  console.log(`[ingest-v2v-showcase] done — ${ok} model(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
