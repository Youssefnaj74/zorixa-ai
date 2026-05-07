# Supabase setup (Zorixa AI)

## 1. Create a project

Create a project at [supabase.com](https://supabase.com/dashboard). Note the **Project URL** and keys from **Project Settings → API**.

## 2. Environment variables (`.env.local`)

Next.js loads `.env.local` automatically (do not commit it). Set:

| Variable | Where to copy |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (server only; never expose to the browser) |

Optional: `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`) for auth redirects.

## 3. Apply the database schema

`schema.sql` is **idempotent** (`if not exists` / `drop policy if exists`). Safe to run more than once.

**Recommended:** Supabase Dashboard → **SQL Editor** → New query → paste the full contents of `supabase/schema.sql` → **Run**.

**CLI (optional):** With the DB connection string from **Project Settings → Database** (URI), percent-encode the password if it has special characters, then:

```bash
npx supabase db query --db-url "postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres" -f supabase/schema.sql
```

Or link the project (`npx supabase link`) and use `db query --linked` per [Supabase CLI](https://supabase.com/docs/guides/cli).

## 4. Auth

In **Authentication → Providers**:

- Enable **Email**
- For Google OAuth: enable **Google** and add redirect URL `http://localhost:3000/auth/callback` (add your production URL when you deploy).

## 5. Verify locally

```bash
npm run verify:supabase   # REST checks (tables + uploads bucket)
npm run dev               # app loads .env.local
```

## 6. Storage

The schema ensures a public **`uploads`** bucket exists for `app/api/upload`. If you created the project before this line was added, re-run `schema.sql` or create the bucket manually in **Storage** with the same name.
