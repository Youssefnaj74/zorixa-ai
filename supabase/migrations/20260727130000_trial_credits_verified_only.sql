-- Trial credits are no longer granted at profile insert.
-- New users start at 0; grant_trial_credits_if_eligible runs only after email is verified.

alter table public.users_profiles
  alter column credits_balance set default 0;

alter table public.users_profiles
  add column if not exists trial_credits_granted_at timestamptz;

comment on column public.users_profiles.trial_credits_granted_at is
  'Set when the one-time verified-email trial (100 credits) was granted.';

-- Block clients from forging trial grant timestamps.
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
     or new.trial_credits_granted_at is distinct from old.trial_credits_granted_at then
    raise exception 'billing columns are server-only'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.grant_trial_credits_if_eligible(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmed timestamptz;
  v_updated int;
begin
  if p_user_id is null then
    return 'invalid';
  end if;

  select u.email_confirmed_at
    into v_confirmed
  from auth.users u
  where u.id = p_user_id;

  if not found then
    return 'user_not_found';
  end if;

  if v_confirmed is null then
    return 'unverified';
  end if;

  -- Ensure profile row exists (trigger usually created it with 0 credits).
  insert into public.users_profiles (id, credits_balance)
  values (p_user_id, 0)
  on conflict (id) do nothing;

  update public.users_profiles
  set
    credits_balance = credits_balance + 100,
    trial_credits_granted_at = now()
  where id = p_user_id
    and trial_credits_granted_at is null;

  get diagnostics v_updated = row_count;

  if v_updated > 0 then
    return 'granted';
  end if;

  return 'already_granted';
end;
$$;

revoke all on function public.grant_trial_credits_if_eligible(uuid) from public;
revoke all on function public.grant_trial_credits_if_eligible(uuid) from anon;
revoke all on function public.grant_trial_credits_if_eligible(uuid) from authenticated;
grant execute on function public.grant_trial_credits_if_eligible(uuid) to service_role;
