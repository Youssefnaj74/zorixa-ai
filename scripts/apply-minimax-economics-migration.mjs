/**
 * Apply generation_economics MiniMax provider migration to Supabase Postgres.
 * Requires SUPABASE_DB_URL (Project Settings → Database → Connection string URI).
 *
 * Run: node scripts/apply-minimax-economics-migration.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const migrationPath = path.join(
  root,
  "supabase/migrations/20260705120000_generation_economics_minimax.sql"
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
  ...process.env,
  ...parseEnvFile(path.join(root, ".env.vercel.pull")),
  ...parseEnvFile(path.join(root, ".env.local"))
};

function projectRefFromSupabaseUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

function buildPoolerUrl(password, ref) {
  const enc = encodeURIComponent(password);
  const regions = [
    "aws-0-eu-central-1",
    "aws-0-us-east-1",
    "aws-0-us-west-1",
    "aws-0-ap-southeast-1",
    "aws-0-ap-northeast-1"
  ];
  return regions.map(
    (region) =>
      `postgresql://postgres.${ref}:${enc}@${region}.pooler.supabase.com:6543/postgres`
  );
}

let dbUrl = (env.SUPABASE_DB_URL ?? env.DATABASE_URL ?? "").trim();
const dbPassword = (env.SUPABASE_DB_PASSWORD ?? env.POSTGRES_PASSWORD ?? "").trim();
const projectRef = projectRefFromSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL ?? "");

if (!dbUrl && dbPassword && projectRef) {
  const candidates = buildPoolerUrl(dbPassword, projectRef);
  for (const candidate of candidates) {
    const probe = spawnSync(
      "npx",
      [
        "--yes",
        "-p",
        "pg@8.16.0",
        "node",
        "--input-type=module",
        "-e",
        `import pg from "pg"; const c=new pg.Client({connectionString:${JSON.stringify(candidate)},ssl:{rejectUnauthorized:false}}); await c.connect(); await c.query("select 1"); await c.end();`
      ],
      { cwd: root, env: { ...process.env }, stdio: "pipe", shell: true }
    );
    if (probe.status === 0) {
      dbUrl = candidate;
      console.log("Resolved pooler connection for project", projectRef);
      break;
    }
  }
}

if (!dbUrl) {
  console.error("Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD to apply the migration.");
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
console.log("MiniMax generation_economics migration applied successfully.");
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
