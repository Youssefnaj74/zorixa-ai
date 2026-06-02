-- Per-user API keys for Zorixa REST / Cursor MCP (credits billed to key owner)

create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profiles (id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists user_api_keys_user_id_idx on public.user_api_keys (user_id);
create index if not exists user_api_keys_active_idx on public.user_api_keys (user_id) where revoked_at is null;

alter table public.user_api_keys enable row level security;

drop policy if exists "user_api_keys_select_own" on public.user_api_keys;
create policy "user_api_keys_select_own"
on public.user_api_keys for select
using (auth.uid() = user_id);

-- Inserts/updates/revokes via service role (API routes) only
