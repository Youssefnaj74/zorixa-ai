/**
 * Convert landing gallery PNGs and video showcase poster frames to WebP + AVIF.
 *
 * Usage: npm run optimize:landing-media
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

const TARGETS = [
  path.join(PUBLIC, "landing-gallery"),
  path.join(PUBLIC, "video-showcases", "i2v")
];

const WEBP_QUALITY = 86;
const AVIF_QUALITY = 72;

async function collectPngFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPngFiles(full)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".png")) {
      files.push(full);
    }
  }

  return files;
}

async function optimizeOne(pngPath) {
  const base = pngPath.slice(0, -4);
  const webpPath = `${base}.webp`;
  const avifPath = `${base}.avif`;
  const input = sharp(pngPath);
  const meta = await input.metadata();

  await sharp(pngPath).webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(webpPath);
  await sharp(pngPath).avif({ quality: AVIF_QUALITY, effort: 4 }).toFile(avifPath);

  const [pngStat, webpStat, avifStat] = await Promise.all([
    fs.stat(pngPath),
    fs.stat(webpPath),
    fs.stat(avifPath)
  ]);

  const rel = path.relative(PUBLIC, pngPath).replace(/\\/g, "/");
  console.log(
    `[optimize-landing-media] ${rel} (${Math.round(pngStat.size / 1024)} KB) → webp ${Math.round(webpStat.size / 1024)} KB, avif ${Math.round(avifStat.size / 1024)} KB (${meta.width}x${meta.height})`
  );
}

async function main() {
  let pngFiles = [];
  for (const dir of TARGETS) {
    try {
      pngFiles.push(...(await collectPngFiles(dir)));
    } catch {
      console.warn(`[optimize-landing-media] skip missing dir ${dir}`);
    }
  }

  if (pngFiles.length === 0) {
    console.log("[optimize-landing-media] no PNG files found");
    return;
  }

  for (const pngPath of pngFiles) {
    await optimizeOne(pngPath);
  }

  console.log(`[optimize-landing-media] done — ${pngFiles.length} source PNG(s) optimized`);
}

main().catch((error) => {
  console.error("[optimize-landing-media] failed:", error);
  process.exit(1);
});
