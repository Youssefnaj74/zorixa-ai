# Supabase setup

1) Create a new Supabase project.
2) In the SQL editor, run `schema.sql`.
3) In Supabase Auth:
   - Enable Email/Password
   - Enable Google provider and set redirect URL to `http://localhost:3000/auth/callback`
4) Copy env vars into `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

