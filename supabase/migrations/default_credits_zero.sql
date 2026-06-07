-- New accounts start with 0 credits (paid-only; credits added via Lemon Squeezy).
alter table public.users_profiles
  alter column credits_balance set default 0;
