-- Historical: briefly set default to 100 for open trial.
-- Superseded by 20260727130000_trial_credits_verified_only.sql (default 0 + verified grant).

alter table public.users_profiles
  alter column credits_balance set default 100;
