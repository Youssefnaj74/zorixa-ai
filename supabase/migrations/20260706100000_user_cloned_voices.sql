-- User-owned MiniMax voice clones (display metadata + activation tracking)

create table if not exists public.user_cloned_voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profiles (id) on delete cascade,
  voice_id text not null,
  display_name text not null,
  source_audio_url text,
  demo_audio_url text,
  provider text not null default 'minimax',
  model_id text,
  status text not null default 'active' check (status in ('pending', 'active', 'failed')),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, voice_id)
);

create index if not exists user_cloned_voices_user_id_idx
  on public.user_cloned_voices (user_id, created_at desc);

alter table public.user_cloned_voices enable row level security;

drop policy if exists "user_cloned_voices_select_own" on public.user_cloned_voices;
create policy "user_cloned_voices_select_own"
on public.user_cloned_voices for select
using (auth.uid() = user_id);
