import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE =
  process.argv[2] ??
  "C:/Users/hp/.cursor/projects/f-zorixa-ai/assets/c__Users_hp_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_5-f9ff97c8-677c-42b9-b815-7b4524166818.png";

const OUT_PUBLIC = path.join(ROOT, "public", "zorixa-icon.png");
const OUT_LETTER = path.join(ROOT, "public", "zorixa-z-letter.png");
const OUT_APP_ICON = path.join(ROOT, "app", "icon.png");
const OUT_APPLE = path.join(ROOT, "app", "apple-icon.png");

function removeDarkBackground(raw, width, height, channels) {
  const out = Buffer.from(raw);
  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const r = out[idx];
    const g = out[idx + 1];
    const b = out[idx + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    // Dark background + glow haze → transparent
    if (max < 95) {
      out[idx + 3] = 0;
      continue;
    }

    // Soft edge on near-black pixels
    if (max < 145 && max - min < 40) {
      out[idx + 3] = Math.min(out[idx + 3], Math.max(0, Math.round(((max - 95) / 50) * 255)));
      continue;
    }

    // Boost logo glow on transparent-friendly PNG
    out[idx + 3] = 255;
  }
  return out;
}

async function buildIcon(size, pngBuffer) {
  return sharp(pngBuffer)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const { data, info } = await sharp(SOURCE)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const cleaned = removeDarkBackground(data, info.width, info.height, info.channels);

const pngSource = await sharp(cleaned, {
  raw: { width: info.width, height: info.height, channels: 4 }
})
  .png()
  .toBuffer();

const trimmed = await sharp(pngSource).trim().png().toBuffer();
const png512 = await buildIcon(512, trimmed);
const letterMark = await sharp(trimmed)
  .resize({ height: 128, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer();

await mkdir(path.dirname(OUT_PUBLIC), { recursive: true });
await writeFile(OUT_PUBLIC, png512);
await writeFile(OUT_LETTER, letterMark);
await writeFile(OUT_APP_ICON, png512);
await writeFile(OUT_APPLE, png512);

console.log("Saved:", OUT_PUBLIC, OUT_LETTER, OUT_APP_ICON, OUT_APPLE);
