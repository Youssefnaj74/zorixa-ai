-- Add premium flag (users_profiles is the app "profiles" table per RLS docs)
alter table public.users_profiles
add column if not exists is_premium boolean not null default false;
