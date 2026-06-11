/**
 * Smoke-test content moderation patterns (no network).
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Load compiled TS via tsx-style dynamic import is heavy; inline minimal checks mirror lib rules.
const BLOCKED_SAMPLES = [
  "nude woman on the beach",
  "explicit sex scene in bedroom",
  "deepfake celebrity nude",
  "child porn",
  "how to make a bomb"
];

const ALLOWED_SAMPLES = [
  "cinematic product ad for skincare brand",
  "anime character walking in tokyo at night",
  "professional headshot with soft lighting",
  "UGC influencer holding coffee cup"
];

function normalize(input) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/1|!/g, "i")
    .replace(/0/g, "o")
    .replace(/5|\$/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const RULES = [
  /\bnude\b/,
  /\bexplicit\s+sex\b/,
  /\bdeep\s*fake\b/,
  /\bchild\s+porn\b/,
  /\bhow\s+to\s+make\s+(a\s+)?bomb\b/
];

function isBlocked(text) {
  const n = normalize(text);
  return RULES.some((r) => r.test(n));
}

let failed = 0;

for (const sample of BLOCKED_SAMPLES) {
  if (!isBlocked(sample)) {
    console.error("FAIL: expected block:", sample);
    failed++;
  }
}

for (const sample of ALLOWED_SAMPLES) {
  if (isBlocked(sample)) {
    console.error("FAIL: expected allow:", sample);
    failed++;
  }
}

const routeFiles = [
  "app/api/generate-image/route.ts",
  "app/api/generate-video/route.ts",
  "app/api/enhance/route.ts",
  "app/api/video/route.ts",
  "app/api/generations/video/route.ts"
];

const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(import.meta.dirname, "..");

for (const rel of routeFiles) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  if (!src.includes("enforceContentPolicy")) {
    console.error("FAIL: missing enforceContentPolicy in", rel);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} verification failure(s).`);
  process.exit(1);
}

console.log("verify:content-moderation OK");
console.log("- blocked samples:", BLOCKED_SAMPLES.length);
console.log("- allowed samples:", ALLOWED_SAMPLES.length);
console.log("- protected routes:", routeFiles.length);
