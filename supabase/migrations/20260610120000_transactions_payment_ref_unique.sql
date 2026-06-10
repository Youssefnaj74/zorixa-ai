-- Prevent duplicate webhook deliveries from granting credits twice (Dodo, Lemon, Atlas refs).
create unique index if not exists transactions_payment_ref_unique_idx
  on public.transactions (lemonsqueezy_order_id)
  where lemonsqueezy_order_id is not null;

-- Atomically record purchase + increment balance in one DB transaction.
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
