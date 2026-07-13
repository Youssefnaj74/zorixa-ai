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
 *   .tmp/a2v/Wan 2.2 Character Swap/ → wan-2-2-character-swap
 *   .tmp/a2v/wan 2.6/ (2 mp4s) → wan-2-6
 *   .tmp/a2v/Wan 2.7/ → wan-2-7
 *   .tmp/a2v/happyhorse-1.0/ → happyhorse-1
 *   .tmp/a2v/Vidu Q3-Pro/ → vidu-q3-pro
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

const REFERENCE_NAMES = ["ref-1.png", "ref-1.jpg", "reference.png", "reference.jpg", "ref.png"];
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
const START_FRAME_NAMES = ["start.png", "start-frame.png", "start.jpg", "image.png"];
const END_FRAME_NAMES = ["end.png", "end-frame.png", "end.jpg", "last_image.png"];

/** modelId → optional legacy folder (under .tmp/a2v) when .tmp/v2v/<id> is missing */
const LEGACY_A2V_FOLDERS = {
  "kling-2-6-motion": path.join(ROOT, ".tmp", "a2v", "Kling 2.6 Motion"),
  "wan-2-2-character-swap": path.join(ROOT, ".tmp", "a2v", "Wan 2.2 Character Swap"),
  "wan-2-6": path.join(ROOT, ".tmp", "a2v", "wan 2.6"),
  "wan-2-7": path.join(ROOT, ".tmp", "a2v", "Wan 2.7"),
  "happyhorse-1": path.join(ROOT, ".tmp", "a2v", "happyhorse-1.0"),
  "vidu-q3-pro": path.join(ROOT, ".tmp", "a2v", "Vidu Q3-Pro")
};

const SOURCE_OUTPUT_MODELS = new Set(["wan-2-6"]);
const VIDEO_EDIT_MODELS = new Set(["wan-2-7", "happyhorse-1"]);
const START_END_MODELS = new Set(["vidu-q3-pro"]);

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

async function listPngs(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".png"))
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

async function resolveLegacyWanCharacterSwapAssets(legacyDir) {
  const characterSrc =
    (await findFirst(legacyDir, CHARACTER_NAMES)) || (await findByExtension(legacyDir, ".png"));
  const mp4s = await listMp4s(legacyDir);
  if (mp4s.length >= 2) {
    return {
      characterSrc,
      motionSrc: mp4s[0],
      videoSrc: mp4s[mp4s.length - 1]
    };
  }
  if (mp4s.length === 1) {
    return { characterSrc, motionSrc: null, videoSrc: mp4s[0] };
  }
  return { characterSrc, motionSrc: null, videoSrc: null };
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

  if (modelId === "wan-2-2-character-swap") {
    return resolveLegacyWanCharacterSwapAssets(legacyDir);
  }

  return resolveLegacyMotionAssets(legacyDir);
}

async function resolveLegacyVideoEditAssets(legacyDir) {
  const { sourceSrc, videoSrc } = await resolveLegacySourceOutputAssets(legacyDir);
  const refSrc = (await findFirst(legacyDir, REFERENCE_NAMES)) || (await findByExtension(legacyDir, ".png"));
  return { sourceSrc, videoSrc, refSrc };
}

async function resolveVideoEditModelAssets(modelId) {
  const srcDir = path.join(TMP_DIR, modelId);
  let sourceSrc = await findFirst(srcDir, SOURCE_NAMES);
  let videoSrc = await findFirst(srcDir, OUTPUT_NAMES);
  let refSrc = await findFirst(srcDir, REFERENCE_NAMES);

  if (sourceSrc && videoSrc) {
    return { sourceSrc, videoSrc, refSrc };
  }

  const legacyDir = LEGACY_A2V_FOLDERS[modelId];
  if (!legacyDir) return { sourceSrc, videoSrc, refSrc };

  try {
    await fs.access(legacyDir);
  } catch {
    return { sourceSrc, videoSrc, refSrc };
  }

  return resolveLegacyVideoEditAssets(legacyDir);
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

/** Legacy .tmp/a2v folders where sorted PNG order is end-first, start-last. */
const LEGACY_START_END_SWAP_MODELS = new Set(["vidu-q3-pro"]);

async function resolveLegacyStartEndAssets(legacyDir, modelId) {
  let startSrc = await findFirst(legacyDir, START_FRAME_NAMES);
  let endSrc = await findFirst(legacyDir, END_FRAME_NAMES);
  let videoSrc = (await findFirst(legacyDir, OUTPUT_NAMES)) || (await findLargestMp4(legacyDir, null));
  const pngs = await listPngs(legacyDir);
  if (pngs.length >= 2) {
    const swap = LEGACY_START_END_SWAP_MODELS.has(modelId);
    if (!startSrc) startSrc = swap ? pngs[pngs.length - 1] : pngs[0];
    if (!endSrc) endSrc = swap ? pngs[0] : pngs[pngs.length - 1];
  } else if (pngs.length === 1 && !startSrc) {
    startSrc = pngs[0];
  }
  return { startSrc, endSrc, videoSrc };
}

async function resolveStartEndModelAssets(modelId) {
  const srcDir = path.join(TMP_DIR, modelId);
  let startSrc = await findFirst(srcDir, START_FRAME_NAMES);
  let endSrc = await findFirst(srcDir, END_FRAME_NAMES);
  let videoSrc = await findFirst(srcDir, OUTPUT_NAMES);

  if (startSrc && endSrc && videoSrc) {
    return { startSrc, endSrc, videoSrc };
  }

  const legacyDir = LEGACY_A2V_FOLDERS[modelId];
  if (!legacyDir) return { startSrc, endSrc, videoSrc };

  try {
    await fs.access(legacyDir);
  } catch {
    return { startSrc, endSrc, videoSrc };
  }

  return resolveLegacyStartEndAssets(legacyDir, modelId);
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

async function ingestVideoEditModel(modelId) {
  const { sourceSrc, videoSrc, refSrc } = await resolveVideoEditModelAssets(modelId);

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

  if (refSrc) {
    const refOut = path.join(OUT_DIR, `${modelId}-ref-1.png`);
    await sharp(refSrc).png({ compressionLevel: 9 }).toFile(refOut);
  } else {
    console.warn(`[ingest-v2v-showcase] ${modelId} — no reference image found (optional)`);
  }

  const posterOk = await tryExtractPoster(videoSrc, posterOut);
  if (!posterOk) {
    console.warn(`[ingest-v2v-showcase] ${modelId} — poster skipped (ffmpeg unavailable)`);
  }

  console.log(`[ingest-v2v-showcase] ok ${modelId} (video-edit)`);
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

async function ingestStartEndModel(modelId) {
  const { startSrc, endSrc, videoSrc } = await resolveStartEndModelAssets(modelId);

  if (!startSrc || !endSrc || !videoSrc) {
    const missing = [
      !startSrc ? "start frame" : null,
      !endSrc ? "end frame" : null,
      !videoSrc ? "output.mp4" : null
    ].filter(Boolean);
    console.warn(`[ingest-v2v-showcase] skip ${modelId} — missing: ${missing.join(", ")}`);
    return false;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const startOut = path.join(OUT_DIR, `${modelId}-start.png`);
  const endOut = path.join(OUT_DIR, `${modelId}-end.png`);
  const videoOut = path.join(OUT_DIR, `${modelId}.mp4`);

  await sharp(startSrc).png({ compressionLevel: 9 }).toFile(startOut);
  await sharp(endSrc).png({ compressionLevel: 9 }).toFile(endOut);
  await fs.copyFile(videoSrc, videoOut);

  console.log(`[ingest-v2v-showcase] ok ${modelId} (start-end)`);
  return true;
}

async function ingestModel(modelId) {
  if (START_END_MODELS.has(modelId)) {
    return ingestStartEndModel(modelId);
  }
  if (VIDEO_EDIT_MODELS.has(modelId)) {
    return ingestVideoEditModel(modelId);
  }
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
