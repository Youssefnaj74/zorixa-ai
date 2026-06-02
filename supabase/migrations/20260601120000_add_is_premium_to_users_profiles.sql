alter table public.users_profiles
  add column if not exists is_premium boolean not null default false;
