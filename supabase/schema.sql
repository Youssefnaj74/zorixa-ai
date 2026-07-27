-- Zorixa AI schema + RLS

-- Profiles (one row per auth user)
create table if not exists public.users_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  credits_balance integer not null default 100,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- Track purchases + usage
create table if not exists public.transactions (
  id bigserial primary key,
  user_id uuid not null references public.users_profiles (id) on delete cascade,
  type text not null check (type in ('purchase', 'usage')),
  credits_amount integer not null,
  lemonsqueezy_order_id text,
  feature_used text check (feature_used in ('enhance', 'video')),
  created_at timestamptz not null default now()
);

create unique index if not exists transactions_payment_ref_unique_idx
  on public.transactions (lemonsqueezy_order_id)
  where lemonsqueezy_order_id is not null;

create or replace function public.grant_purchase_credits(
  p_user_id uuid,
  p_credits integer,
  p_order_ref text
) returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_credits is null or p_credits <= 0 then
    return 'invalid';
  end if;

  if p_order_ref is null or length(trim(p_order_ref)) = 0 then
    return 'invalid';
  end if;

  if not exists (select 1 from public.users_profiles where id = p_user_id) then
    return 'no_profile';
  end if;

  insert into public.transactions (user_id, type, credits_amount, lemonsqueezy_order_id, feature_used)
  values (p_user_id, 'purchase', p_credits, p_order_ref, null);

  update public.users_profiles
  set credits_balance = credits_balance + p_credits
  where id = p_user_id;

  return 'granted';
exception
  when unique_violation then
    return 'duplicate';
end;
$$;

-- Store generations history
create table if not exists public.generations (
  id bigserial primary key,
  user_id uuid not null references public.users_profiles (id) on delete cascade,
  feature_type text not null check (feature_type in ('image', 'video')),
  input_url text not null,
  output_url text,
  provider text not null default 'replicate',
  provider_prediction_id text,
  composer_model_id text,
  prompt text,
  credits_spent integer not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

-- Support requests from /support
create table if not exists public.support_requests (
  id bigserial primary key,
  user_id uuid references public.users_profiles (id) on delete set null,
  name text not null,
  email text not null,
  issue_type text not null,
  subject text not null,
  message text not null,
  screenshot_url text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

-- Per-user API keys (REST / Cursor MCP — credits billed to key owner)
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

-- Invoices (freelancer tools)
create table if not exists public.invoices (
  id bigserial primary key,
  user_id uuid not null references public.users_profiles (id) on delete cascade,
  client_name text not null,
  project_details text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.users_profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.generations enable row level security;
alter table public.support_requests enable row level security;
alter table public.invoices enable row level security;
alter table public.user_api_keys enable row level security;

-- profiles: user can read/update own
drop policy if exists "profiles_select_own" on public.users_profiles;
create policy "profiles_select_own"
on public.users_profiles for select
using (auth.uid() = id);

-- Client UPDATE removed (P0): billing columns protected by trigger; server uses service role.
drop policy if exists "profiles_update_own" on public.users_profiles;

create or replace function public.protect_billing_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if new.credits_balance is distinct from old.credits_balance
     or new.is_premium is distinct from old.is_premium then
    raise exception 'billing columns are server-only'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_users_profiles_billing on public.users_profiles;
create trigger protect_users_profiles_billing
before update on public.users_profiles
for each row
execute function public.protect_billing_columns();

-- transactions: user can read own, inserts allowed via server role (service key) only
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions for select
using (auth.uid() = user_id);

-- generations: user can read own; inserts/updates via server role only
drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own"
on public.generations for select
using (auth.uid() = user_id);

-- support_requests: user can read own submissions (inserts via API service role)
drop policy if exists "support_requests_select_own" on public.support_requests;
create policy "support_requests_select_own"
on public.support_requests for select
using (auth.uid() = user_id and user_id is not null);

-- invoices: user can read/insert own
drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own"
on public.invoices for select
using (auth.uid() = user_id);

drop policy if exists "invoices_insert_own" on public.invoices;
create policy "invoices_insert_own"
on public.invoices for insert
with check (auth.uid() = user_id);

drop policy if exists "user_api_keys_select_own" on public.user_api_keys;
create policy "user_api_keys_select_own"
on public.user_api_keys for select
using (auth.uid() = user_id);

-- Storage bucket for app/api/upload (public read for getPublicUrl; writes use service role)
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
