/**
 * Verify every auth user has a users_profiles row (signup trigger health).
 * Run: node scripts/verify-user-profiles.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

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
  ...process.env
};

const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const key = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`
};

const profileIds = new Set();
let offset = 0;
while (true) {
  const res = await fetch(
    `${url}/rest/v1/users_profiles?select=id&order=id.asc&offset=${offset}&limit=1000`,
    { headers }
  );
  if (!res.ok) {
    console.error("profiles fetch failed", res.status, await res.text());
    process.exit(1);
  }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) break;
  for (const row of rows) profileIds.add(row.id);
  if (rows.length < 1000) break;
  offset += 1000;
}

let page = 1;
const perPage = 1000;
const missing = [];

while (true) {
  const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, { headers });
  if (!res.ok) {
    console.error("auth users fetch failed", res.status, await res.text());
    process.exit(1);
  }
  const body = await res.json();
  const users = body.users ?? [];
  if (users.length === 0) break;
  for (const user of users) {
    if (!profileIds.has(user.id)) {
      missing.push({ id: user.id, email: user.email ?? null });
    }
  }
  if (users.length < perPage) break;
  page += 1;
}

console.log(`Profiles: ${profileIds.size}`);
console.log(`Auth users checked: page ${page}`);

if (missing.length === 0) {
  console.log("All auth users have users_profiles rows.");
  process.exit(0);
}

console.error(`${missing.length} user(s) missing profiles:`);
for (const row of missing.slice(0, 10)) {
  console.error(`  ${row.id} ${row.email ?? ""}`);
}
process.exit(1);
