/**
 * Copy Audio-to-Video showcase assets from .tmp into public/video-showcases/a2v.
 *
 * Drop files per model:
 *   .tmp/a2v/<modelId>/portrait.png   (or .jpg / .webp)
 *   .tmp/a2v/<modelId>/audio.mp3      (or .m4a / .wav)
 *   .tmp/a2v/<modelId>/output.mp4
 *
 * Usage: npm run ingest:a2v-showcase
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP_DIR = path.join(ROOT, ".tmp", "a2v");
const OUT_DIR = path.join(ROOT, "public", "video-showcases", "a2v");

const PORTRAIT_NAMES = ["portrait.png", "portrait.jpg", "portrait.jpeg", "portrait.webp", "image.png"];
const AUDIO_NAMES = ["audio.mp3", "audio.m4a", "audio.wav", "audio.aac"];
const VIDEO_NAMES = ["output.mp4", "video.mp4"];

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

async function ingestModel(modelId) {
  const srcDir = path.join(TMP_DIR, modelId);
  const portraitSrc = await findFirst(srcDir, PORTRAIT_NAMES);
  const audioSrc = await findFirst(srcDir, AUDIO_NAMES);
  const videoSrc = await findFirst(srcDir, VIDEO_NAMES);

  if (!portraitSrc || !audioSrc || !videoSrc) {
    const missing = [
      !portraitSrc ? "portrait" : null,
      !audioSrc ? "audio" : null,
      !videoSrc ? "output.mp4" : null
    ].filter(Boolean);
    console.warn(`[ingest-a2v-showcase] skip ${modelId} — missing: ${missing.join(", ")}`);
    return false;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const portraitOut = path.join(OUT_DIR, `${modelId}-portrait.png`);
  const audioOut = path.join(OUT_DIR, `${modelId}-audio.mp3`);
  const videoOut = path.join(OUT_DIR, `${modelId}.mp4`);

  await sharp(portraitSrc).png({ compressionLevel: 9 }).toFile(portraitOut);

  const audioExt = path.extname(audioSrc).toLowerCase();
  if (audioExt === ".mp3") {
    await fs.copyFile(audioSrc, audioOut);
  } else {
    await fs.copyFile(audioSrc, path.join(OUT_DIR, `${modelId}-audio${audioExt}`));
    console.warn(
      `[ingest-a2v-showcase] ${modelId}: copied audio as *${audioExt} — update video-a2v-showcase-paths if not .mp3`
    );
  }

  await fs.copyFile(videoSrc, videoOut);

  const webpOut = path.join(OUT_DIR, `${modelId}-portrait.webp`);
  const avifOut = path.join(OUT_DIR, `${modelId}-portrait.avif`);
  await sharp(portraitOut).webp({ quality: 86, effort: 4 }).toFile(webpOut);
  await sharp(portraitOut).avif({ quality: 72, effort: 4 }).toFile(avifOut);

  console.log(`[ingest-a2v-showcase] ok ${modelId}`);
  return true;
}

async function main() {
  let entries;
  try {
    entries = await fs.readdir(TMP_DIR, { withFileTypes: true });
  } catch {
    console.error(`[ingest-a2v-showcase] create ${TMP_DIR} and add model folders first`);
    process.exit(1);
  }

  const modelDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  if (modelDirs.length === 0) {
    console.error(`[ingest-a2v-showcase] no model folders in ${TMP_DIR}`);
    process.exit(1);
  }

  let ok = 0;
  for (const modelId of modelDirs) {
    if (await ingestModel(modelId)) ok += 1;
  }

  if (ok === 0) process.exit(1);
  console.log(`[ingest-a2v-showcase] done — ${ok} model(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
