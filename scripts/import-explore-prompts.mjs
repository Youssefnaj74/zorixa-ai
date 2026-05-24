/**
 * Merge prompts from data/explore-prompts-import.json → data/explore-prompts.json
 *
 * Paste Enhancor-style rows in the import file:
 * [
 *   {
 *     "enhancorModel": "Kora Reality",
 *     "title": "Fashion editorial",
 *     "prompt": "English prompt text...",
 *     "featured": true
 *   }
 * ]
 *
 * Run: npm run import:explore-prompts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const catalogPath = path.join(root, "data", "explore-prompts.json");
const importPath = path.join(root, "data", "explore-prompts-import.json");

const ENHANCOR_MAP = {
  "gpt image 2": "gpt-image-2",
  "seedream 5 lite": "seedream-5",
  "kora reality": "zorixa",
  "zorixa image": "zorixa",
  "z-image base": "flux-dev",
  "grok imagine": "grok-imagine",
  "nano banana": "nano-banana-2",
  "nano banana 2": "nano-banana-2",
  "nano banana pro": "nano-banana-pro",
  "flux dev": "flux-dev",
  "flux schnell": "flux-schnell"
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function resolveModelId(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const direct = raw.trim();
  if (/^[a-z0-9-]+$/.test(direct)) return direct;
  return ENHANCOR_MAP[direct.toLowerCase()] ?? null;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const existing = readJson(catalogPath, []);
const incoming = readJson(importPath, null);

if (!Array.isArray(incoming)) {
  console.error(`Create ${path.relative(root, importPath)} with an array of prompts.`);
  process.exit(1);
}

if (incoming.length === 0) {
  console.log("explore-prompts-import.json is empty — paste Enhancor prompts there first.");
  process.exit(0);
}

const byId = new Map(existing.map((e) => [e.id, e]));
let added = 0;

for (const row of incoming) {
  const prompt = typeof row.prompt === "string" ? row.prompt.trim() : "";
  if (!prompt) continue;

  const modelId =
    resolveModelId(row.modelId) ??
    resolveModelId(row.enhancorModel) ??
    resolveModelId(row.model);
  if (!modelId) {
    console.warn("Skip (unknown model):", row.title ?? prompt.slice(0, 40));
    continue;
  }

  const title =
    typeof row.title === "string" && row.title.trim()
      ? row.title.trim()
      : prompt.slice(0, 48);

  const id =
    typeof row.id === "string" && row.id.trim()
      ? row.id.trim()
      : `${modelId}-${slugify(title)}`;

  const entry = {
    id,
    modelId,
    title,
    prompt,
    aspectRatio: "3:4",
    ...(row.featured ? { featured: true } : {}),
    ...(typeof row.imageUrl === "string" && row.imageUrl.trim()
      ? { imageUrl: row.imageUrl.trim() }
      : {})
  };

  if (!byId.has(id)) added += 1;
  byId.set(id, entry);
}

const merged = [...byId.values()];
fs.writeFileSync(catalogPath, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`Updated ${path.relative(root, catalogPath)} — ${merged.length} total (+${added} new).`);
console.log("Merge mode: existing prompts are kept; same id = updated, new id = added.");
console.log("Do NOT empty explore-prompts.json unless you want a full reset.");
console.log("Next: npm run generate:explore-previews");
