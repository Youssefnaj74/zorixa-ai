-- Per-generation profitability & provider tracking (service role only).
create table if not exists public.generation_economics (
  id bigserial primary key,
  user_id uuid not null references public.users_profiles(id) on delete cascade,
  generation_id bigint references public.generations(id) on delete set null,
  prediction_id text,
  composer_model_id text,
  model_label text not null,
  workflow text not null,
  provider_used text not null check (provider_used in ('byteplus', 'atlas')),
  provider_attempted text check (provider_attempted in ('byteplus', 'atlas')),
  fallback_used boolean not null default false,
  fallback_reason text,
  generation_status text not null check (
    generation_status in ('pending', 'success', 'failed', 'fallback_to_atlas')
  ),
  resolution text,
  aspect_ratio text,
  duration_sec integer,
  generate_audio boolean,
  speed_tier text,
  credits_charged integer not null default 0,
  revenue_usd numeric(12, 6) not null default 0,
  provider_cost_usd numeric(12, 6) not null default 0,
  gross_profit_usd numeric(12, 6) not null default 0,
  profit_margin_pct numeric(8, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists generation_economics_prediction_id_uidx
  on public.generation_economics (prediction_id)
  where prediction_id is not null;

create index if not exists generation_economics_created_at_idx
  on public.generation_economics (created_at desc);

create index if not exists generation_economics_provider_used_idx
  on public.generation_economics (provider_used);

create index if not exists generation_economics_workflow_idx
  on public.generation_economics (workflow);

alter table public.generation_economics enable row level security;

-- No client policies — admin reads via service role API only.
