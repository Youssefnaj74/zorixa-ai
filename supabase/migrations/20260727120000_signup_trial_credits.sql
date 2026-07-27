-- Give new signups a small starter balance so "create account" is not a hard paywall.
-- Existing users are unchanged; only the column default applies to new inserts.

alter table public.users_profiles
  alter column credits_balance set default 100;
