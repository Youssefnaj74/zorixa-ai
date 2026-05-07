/**
 * Smoke test: reads .env.local and checks Supabase REST (tables + storage).
 * Run from repo root: node scripts/supabase-verify.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function parseEnvLocal(file) {
  if (!fs.existsSync(file)) {
    console.error("Missing .env.local at", file);
    process.exit(1);
  }
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    out[key] = t.slice(i + 1).trim();
  }
  return out;
}

const env = parseEnvLocal(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}
if (!service) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

async function get(path, key, label) {
  const res = await fetch(`${url}${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  const ok = res.ok;
  console.log(`${label}: HTTP ${res.status}${ok ? " OK" : ""}`);
  if (!ok) {
    const text = await res.text();
    console.error(text.slice(0, 500));
  }
  return ok;
}

let ok = true;
ok = (await get("/rest/v1/users_profiles?select=id&limit=1", service, "REST users_profiles (service role)")) && ok;
ok = (await get("/storage/v1/bucket/uploads", service, "Storage bucket uploads")) && ok;

process.exit(ok ? 0 : 1);
