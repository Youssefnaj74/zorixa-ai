-- One-time Starter Pass eligibility + billing-column protection.

alter table public.users_profiles
  add column if not exists starter_pass_purchased_at timestamptz;

comment on column public.users_profiles.starter_pass_purchased_at is
  'Set when the one-time $0.99 Starter Pass was purchased (new users only).';

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
     or new.is_premium is distinct from old.is_premium
     or new.trial_credits_granted_at is distinct from old.trial_credits_granted_at
     or new.starter_pass_purchased_at is distinct from old.starter_pass_purchased_at then
    raise exception 'billing columns are server-only'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
