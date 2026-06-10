/**
 * Pre-migration check: duplicate lemonsqueezy_order_id values block the unique index.
 * Run: node scripts/check-payment-ref-duplicates.mjs
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

let offset = 0;
const pageSize = 1000;
const counts = new Map();

while (true) {
  const res = await fetch(
    `${url}/rest/v1/transactions?select=lemonsqueezy_order_id&lemonsqueezy_order_id=not.is.null&order=id.asc&offset=${offset}&limit=${pageSize}`,
    { headers }
  );
  if (!res.ok) {
    console.error("REST error", res.status, await res.text());
    process.exit(1);
  }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) break;
  for (const row of rows) {
    const ref = row.lemonsqueezy_order_id;
    if (typeof ref === "string" && ref.trim()) {
      counts.set(ref, (counts.get(ref) ?? 0) + 1);
    }
  }
  if (rows.length < pageSize) break;
  offset += pageSize;
}

const dupes = [...counts.entries()].filter(([, n]) => n > 1);

console.log(`Scanned ${counts.size} distinct payment refs.`);

if (dupes.length === 0) {
  console.log("No duplicates — safe to apply transactions_payment_ref_unique_idx.");
  process.exit(0);
}

console.error(`Found ${dupes.length} duplicate ref(s):`);
for (const [ref, n] of dupes.slice(0, 20)) {
  console.error(`  ${ref} (${n}x)`);
}
process.exit(1);
