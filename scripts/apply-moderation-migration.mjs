/**
 * Apply moderation_blocks migration to Supabase Postgres.
 * Requires SUPABASE_DB_URL (Project Settings → Database → Connection string URI).
 *
 * Run: node scripts/apply-moderation-migration.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const migrationPath = path.join(
  root,
  "supabase/migrations/20260611120000_moderation_blocks.sql"
);

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
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

const env = {
  ...parseEnvFile(path.join(root, ".env.local")),
  ...parseEnvFile(path.join(root, ".env.vercel.pull")),
  ...process.env
};

const dbUrl = (env.SUPABASE_DB_URL ?? env.DATABASE_URL ?? "").trim();

if (!dbUrl) {
  console.error("Set SUPABASE_DB_URL to your Supabase Postgres connection string.");
  console.error(`Or paste ${migrationPath} in Supabase Dashboard → SQL Editor.`);
  process.exit(1);
}

if (!fs.existsSync(migrationPath)) {
  console.error("Migration file not found:", migrationPath);
  process.exit(1);
}

const runner = `
import fs from "fs";
import pg from "pg";
const sql = fs.readFileSync(${JSON.stringify(migrationPath)}, "utf8");
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(sql);
await client.end();
console.log("Moderation migration applied successfully.");
`;

const result = spawnSync(
  "npx",
  ["--yes", "-p", "pg@8.16.0", "node", "--input-type=module", "-e", runner],
  {
    cwd: root,
    env: { ...process.env, SUPABASE_DB_URL: dbUrl },
    stdio: "inherit",
    shell: true
  }
);

process.exit(result.status ?? 1);
