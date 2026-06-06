-- AI Director run log — routing metadata + future feedback signals (liked, downloaded).
create table if not exists public.director_runs (
  id bigserial primary key,
  user_id uuid not null references public.users_profiles (id) on delete cascade,
  prompt text not null,
  style_requested text not null,
  style_resolved text not null,
  routed_model text not null,
  route_action text not null check (route_action in ('text', 'image')),
  success boolean not null default true,
  prediction_id text,
  output_url text,
  user_liked boolean not null default false,
  user_downloaded boolean not null default false,
  credits_spent integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists director_runs_user_id_created_at_idx
  on public.director_runs (user_id, created_at desc);

alter table public.director_runs enable row level security;

drop policy if exists "director_runs_select_own" on public.director_runs;
create policy "director_runs_select_own"
on public.director_runs for select
using (auth.uid() = user_id);
