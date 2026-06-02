/**
 * Dev server with TEMP/TMP on project drive (avoids C: full disk → Array buffer allocation failed).
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const tmpDir = join(process.cwd(), ".tmp");
mkdirSync(tmpDir, { recursive: true });

const env = {
  ...process.env,
  TEMP: tmpDir,
  TMP: tmpDir,
  NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--max-old-space-size=4096"
};

const nextArgs = process.argv.slice(2);
const args = ["next", "dev", ...nextArgs];

const child = spawn("npx", args, {
  stdio: "inherit",
  shell: true,
  env,
  cwd: process.cwd()
});

child.on("exit", (code) => process.exit(code ?? 1));
