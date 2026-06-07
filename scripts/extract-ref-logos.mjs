import sharp from "sharp";
import { readFile, mkdir } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedanceRef = path.join(__dirname, "assets", "seedance-official-ref.png");
const outFile = path.join(__dirname, "..", "public", "models", "seedance.png");

await mkdir(path.dirname(outFile), { recursive: true });

const seedBuf = await readFile(seedanceRef);
const seedMeta = await sharp(seedBuf).metadata();
const seedIconW = Math.round((seedMeta.width ?? 800) * 0.08);
const iconH = Math.round((seedMeta.height ?? 200) * 0.55);

await sharp(seedBuf)
  .extract({
    left: Math.round((seedMeta.width ?? 800) * 0.018),
    top: Math.round((seedMeta.height ?? 200) * 0.22),
    width: seedIconW,
    height: iconH
  })
  .resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(outFile);

console.log("OK", outFile);
