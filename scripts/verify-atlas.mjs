/**
 * Smoke-test Atlas Cloud with the same env name as the app: ATLASCLOUD_API_KEY in .env.local
 * Run: npm run verify:atlas
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const local = parseEnvFile(path.join(root, ".env.local"));
const key = (local.ATLASCLOUD_API_KEY ?? process.env.ATLASCLOUD_API_KEY ?? "").trim();

if (!key) {
  console.error("ATLASCLOUD_API_KEY is missing or empty.");
  console.error("Set it in .env.local (same name as Vercel), then run: npm run verify:atlas");
  process.exit(1);
}

const ATLAS = "https://api.atlascloud.ai/api/v1/model";
const body = {
  model: "bytedance/seedance-2.0/image-to-video",
  prompt: "Zorixa smoke test: subtle camera push-in",
  image: "https://picsum.photos/seed/zorixa-atlas/512/512",
  width: 512,
  height: 512,
  duration: 5,
  fps: 24
};

console.log("POST generateVideo (Seedance 2.0 I2V)…");
const res = await fetch(`${ATLAS}/generateVideo`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

const json = await res.json().catch(() => ({}));
console.log("HTTP", res.status);
console.log(JSON.stringify(json, null, 2));

if (!res.ok) {
  console.error("Atlas rejected the request.");
  process.exit(1);
}

const id = json.data?.id;
if (!id) {
  console.error("No prediction id in response.");
  process.exit(1);
}

console.log("\nPolling prediction once (2s delay)…");
await new Promise((r) => setTimeout(r, 2000));
const poll = await fetch(`${ATLAS}/prediction/${id}`, {
  headers: { Authorization: `Bearer ${key}` },
  cache: "no-store"
});
const pollJson = await poll.json().catch(() => ({}));
console.log("poll HTTP", poll.status);
console.log(JSON.stringify(pollJson, null, 2));

if (!poll.ok) process.exit(1);
console.log("\nOK — key works; wait for status completed/succeeded in Atlas UI or poll again.");
