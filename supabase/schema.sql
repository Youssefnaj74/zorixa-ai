-- Zorixa AI schema + RLS

-- Profiles (one row per auth user)
create table if not exists public.users_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  credits_balance integer not null default 10,
  created_at timestamptz not null default now()
);

-- Track purchases + usage
create table if not exists public.transactions (
  id bigserial primary key,
  user_id uuid not null references public.users_profiles (id) on delete cascade,
  type text not null check (type in ('purchase', 'usage')),
  credits_amount integer not null,
  stripe_payment_id text,
  feature_used text check (feature_used in ('enhance', 'video')),
  created_at timestamptz not null default now()
);

-- Store generations history
create table if not exists public.generations (
  id bigserial primary key,
  user_id uuid not null references public.users_profiles (id) on delete cascade,
  feature_type text not null check (feature_type in ('image', 'video')),
  input_url text not null,
  output_url text,
  provider text not null default 'replicate',
  provider_prediction_id text,
  credits_spent integer not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
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

-- profiles: user can read/update own
drop policy if exists "profiles_select_own" on public.users_profiles;
create policy "profiles_select_own"
on public.users_profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.users_profiles;
create policy "profiles_update_own"
on public.users_profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

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

