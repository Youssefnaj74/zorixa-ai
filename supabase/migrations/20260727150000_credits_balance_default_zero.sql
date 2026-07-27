-- Production safety: credits_balance must default to 0 for new profiles.
-- Idempotent; safe if an earlier migration already applied this.

alter table public.users_profiles
  alter column credits_balance set default 0;

comment on column public.users_profiles.credits_balance is
  'Spendable credit balance. New profiles default to 0; grants come from verified trial or purchases.';
