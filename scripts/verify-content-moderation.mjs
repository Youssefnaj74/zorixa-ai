/**
 * Verify generation API routes always gate through enforceContentPolicy,
 * then run the moderation unit suite (vitest).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PROTECTED_ROUTES = [
  "app/api/generate-image/route.ts",
  "app/api/generate-video/route.ts",
  "app/api/enhance/route.ts",
  "app/api/video/route.ts",
  "app/api/generations/video/route.ts"
];

let failed = 0;

const MEDIA_ROUTES = [
  "app/api/generate-image/route.ts",
  "app/api/generate-video/route.ts",
  "app/api/video/route.ts",
  "app/api/generations/video/route.ts"
];

for (const rel of PROTECTED_ROUTES) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  if (!src.includes("enforceContentPolicy")) {
    console.error("FAIL: missing enforceContentPolicy in", rel);
    failed++;
  }
  // Generation routes must moderate before any provider create call pattern is enough
  // via enforceContentPolicy presence; generate-* must import the shared module.
  if (
    (rel.includes("generate-image") || rel.includes("generate-video")) &&
    !src.includes('@/lib/content-moderation')
  ) {
    console.error("FAIL: missing content-moderation import in", rel);
    failed++;
  }
}

for (const rel of MEDIA_ROUTES) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  if (!src.includes("enforceMediaContentPolicy")) {
    console.error("FAIL: missing enforceMediaContentPolicy in", rel);
    failed++;
  }
}

const vitest = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "vitest",
    "run",
    "lib/content-moderation/moderate-prompt.test.ts",
    "lib/content-moderation/moderate-media.test.ts"
  ],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" }
);

if (vitest.status !== 0) {
  failed += 1;
  console.error("FAIL: vitest moderation suite");
}

if (failed > 0) {
  console.error(`\n${failed} verification failure(s).`);
  process.exit(1);
}

console.log("verify:content-moderation OK");
console.log("- protected routes:", PROTECTED_ROUTES.length);
console.log("- unit tests: lib/content-moderation/moderate-prompt.test.ts");
