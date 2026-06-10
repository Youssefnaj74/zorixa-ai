/**
 * Apply billing hardening migration to Supabase Postgres.
 * Requires SUPABASE_DB_URL (Project Settings → Database → Connection string URI).
 *
 * Run:
 *   set SUPABASE_DB_URL=postgresql://postgres.[ref]:[PASSWORD]@...
 *   node scripts/apply-billing-migration.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const migrationPath = path.join(
  root,
  "supabase/migrations/20260610120000_transactions_payment_ref_unique.sql"
);

const dbUrl = (process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL ?? "").trim();

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
console.log("Migration applied successfully.");
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
