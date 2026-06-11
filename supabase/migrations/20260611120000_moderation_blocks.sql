-- Audit log for blocked generation prompts (content policy enforcement).
create table if not exists public.moderation_blocks (
  id bigserial primary key,
  user_id uuid references public.users_profiles (id) on delete set null,
  workflow text not null,
  route text not null,
  category text not null,
  matched_pattern text not null,
  prompt_preview text not null,
  prompt_normalized_preview text not null,
  ip_address text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists moderation_blocks_created_at_idx
  on public.moderation_blocks (created_at desc);

create index if not exists moderation_blocks_user_id_created_at_idx
  on public.moderation_blocks (user_id, created_at desc);

alter table public.moderation_blocks enable row level security;

-- No client policies: service role inserts; admin review via dashboard/SQL only.
