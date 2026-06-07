#!/usr/bin/env node
/**
 * Re-download official model logos into public/models/.
 * Usage: node scripts/sync-model-logos.mjs
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "models");

const SOURCES = {
  "openai-icon.svg":
    "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  "google-g.svg":
    "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
  "gemini.svg":
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg",
  "kling.ico": "https://klingai.com/favicon.ico",
  "wan.ico": "https://wan.video/favicon.ico",
  "alibaba.ico": "https://www.alibaba.com/favicon.ico",
  "hailuo.ico": "https://www.minimaxi.com/favicon.ico",
  "vidu.svg": "https://www.vidu.com/logo.svg",
  "flux.ico": "https://bfl.ai/favicon.ico"
};

const GROK_SVG_URL =
  "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/grok.svg";

const UA = "ZorixaAI-LogoSync/1.0 (+https://www.zorixaai.com)";

await mkdir(outDir, { recursive: true });

for (const [file, url] of Object.entries(SOURCES)) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) throw new Error("response too small");
    await writeFile(path.join(outDir, file), buf);
    console.log(`OK ${file} (${buf.length} bytes)`);
  } catch (e) {
    console.error(`FAIL ${file}: ${e.message}`);
  }
}

try {
  const res = await fetch(GROK_SVG_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const svg = (await res.text()).replace(/fill="currentColor"/, 'fill="#FFFFFF"');
  await writeFile(path.join(outDir, "grok.svg"), svg);
  console.log("OK grok.svg (xAI Grok mark, white for dark UI)");
} catch (e) {
  console.error(`FAIL grok.svg: ${e.message}`);
}

try {
  execSync("node scripts/extract-ref-logos.mjs", { cwd: path.join(__dirname, ".."), stdio: "inherit" });
  console.log("OK seedance.png (Seedance 2.0 four-bar mark)");
} catch (e) {
  console.error(`FAIL seedance.png: ${e.message}`);
}

const copies = [
  ["google-g.svg", "veo.svg"],
  ["alibaba.ico", "happyhorse.ico"],
  ["alibaba.ico", "qwen.ico"]
];
for (const [from, to] of copies) {
  try {
    await copyFile(path.join(outDir, from), path.join(outDir, to));
    console.log(`COPY ${from} → ${to}`);
  } catch (e) {
    console.error(`COPY FAIL ${from} → ${to}: ${e.message}`);
  }
}
