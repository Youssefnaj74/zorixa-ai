/**
 * Copy Video-to-Video showcase assets from .tmp into public/video-showcases/v2v.
 *
 * Motion-control layout (Kling 2.6 Motion):
 *   .tmp/v2v/<modelId>/character.png + motion.mp4 + output.mp4
 *
 * Source-output layout (Wan 2.6):
 *   .tmp/v2v/<modelId>/source.mp4 + output.mp4
 *
 * Legacy:
 *   .tmp/a2v/Kling 2.6 Motion/ → kling-2-6-motion
 *   .tmp/a2v/wan 2.6/ (2 mp4s) → wan-2-6
 *
 * Usage: npm run ingest:v2v-showcase
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const execFileAsync = promisify(execFile);

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
const SOURCE_NAMES = ["source.mp4", "input.mp4", "reference.mp4"];
const OUTPUT_NAMES = ["output.mp4", "video.mp4", "zorixa-video.mp4"];

/** modelId → optional legacy folder (under .tmp/a2v) when .tmp/v2v/<id> is missing */
const LEGACY_A2V_FOLDERS = {
  "kling-2-6-motion": path.join(ROOT, ".tmp", "a2v", "Kling 2.6 Motion"),
  "wan-2-6": path.join(ROOT, ".tmp", "a2v", "wan 2.6")
};

const SOURCE_OUTPUT_MODELS = new Set(["wan-2-6"]);

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

async function listMp4s(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".mp4"))
      .map((e) => path.join(dir, e.name))
      .sort((a, b) => path.basename(a).localeCompare(path.basename(b), undefined, { numeric: true }));
  } catch {
    return [];
  }
}

async function findLargestMp4(dir, exclude) {
  const mp4s = await listMp4s(dir);
  if (mp4s.length === 0) return null;
  if (mp4s.length === 1) return mp4s[0];

  let best = null;
  let bestSize = -1;
  for (const full of mp4s) {
    if (exclude && full === exclude) continue;
    const stat = await fs.stat(full);
    if (stat.size > bestSize) {
      bestSize = stat.size;
      best = full;
    }
  }
  return best;
}

async function resolveLegacyMotionAssets(legacyDir) {
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
    const mp4s = await listMp4s(legacyDir);
    if (mp4s.length >= 2) {
      const sized = await Promise.all(mp4s.map(async (p) => ({ p, size: (await fs.stat(p)).size })));
      sized.sort((a, b) => a.size - b.size);
      motionSrc = sized[0].p;
      if (!outputSrc) {
        return { characterSrc, motionSrc, videoSrc: sized[sized.length - 1].p };
      }
    }
  }
  return { characterSrc, motionSrc, videoSrc: outputSrc };
}

async function resolveLegacySourceOutputAssets(legacyDir) {
  let sourceSrc = await findFirst(legacyDir, SOURCE_NAMES);
  let videoSrc = await findFirst(legacyDir, OUTPUT_NAMES);
  const mp4s = await listMp4s(legacyDir);
  if (mp4s.length >= 2) {
    if (!sourceSrc) sourceSrc = mp4s[0];
    if (!videoSrc) videoSrc = mp4s[mp4s.length - 1];
  } else if (mp4s.length === 1 && !videoSrc) {
    videoSrc = mp4s[0];
  }
  return { sourceSrc, videoSrc };
}

async function resolveMotionModelAssets(modelId) {
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

  return resolveLegacyMotionAssets(legacyDir);
}

async function resolveSourceOutputModelAssets(modelId) {
  const srcDir = path.join(TMP_DIR, modelId);
  let sourceSrc = await findFirst(srcDir, SOURCE_NAMES);
  let videoSrc = await findFirst(srcDir, OUTPUT_NAMES);

  if (sourceSrc && videoSrc) {
    return { sourceSrc, videoSrc };
  }

  const legacyDir = LEGACY_A2V_FOLDERS[modelId];
  if (!legacyDir) return { sourceSrc, videoSrc };

  try {
    await fs.access(legacyDir);
  } catch {
    return { sourceSrc, videoSrc };
  }

  return resolveLegacySourceOutputAssets(legacyDir);
}

async function tryExtractPoster(videoPath, posterOut) {
  try {
    await execFileAsync(
      "ffmpeg",
      ["-y", "-i", videoPath, "-vframes", "1", "-q:v", "2", posterOut],
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

async function ingestMotionModel(modelId) {
  const { characterSrc, motionSrc, videoSrc } = await resolveMotionModelAssets(modelId);

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

  console.log(`[ingest-v2v-showcase] ok ${modelId} (motion-control)`);
  return true;
}

async function ingestSourceOutputModel(modelId) {
  const { sourceSrc, videoSrc } = await resolveSourceOutputModelAssets(modelId);

  if (!sourceSrc || !videoSrc) {
    const missing = [!sourceSrc ? "source.mp4" : null, !videoSrc ? "output.mp4" : null].filter(Boolean);
    console.warn(`[ingest-v2v-showcase] skip ${modelId} — missing: ${missing.join(", ")}`);
    return false;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const sourceOut = path.join(OUT_DIR, `${modelId}-source.mp4`);
  const videoOut = path.join(OUT_DIR, `${modelId}.mp4`);
  const posterOut = path.join(OUT_DIR, `${modelId}-poster.png`);

  await fs.copyFile(sourceSrc, sourceOut);
  await fs.copyFile(videoSrc, videoOut);

  const posterOk = await tryExtractPoster(videoSrc, posterOut);
  if (!posterOk) {
    console.warn(`[ingest-v2v-showcase] ${modelId} — poster skipped (ffmpeg unavailable)`);
  }

  console.log(`[ingest-v2v-showcase] ok ${modelId} (source-output)`);
  return true;
}

async function ingestModel(modelId) {
  if (SOURCE_OUTPUT_MODELS.has(modelId)) {
    return ingestSourceOutputModel(modelId);
  }
  return ingestMotionModel(modelId);
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
    console.error(`[ingest-v2v-showcase] add folders under ${TMP_DIR} or legacy .tmp/a2v/*`);
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
