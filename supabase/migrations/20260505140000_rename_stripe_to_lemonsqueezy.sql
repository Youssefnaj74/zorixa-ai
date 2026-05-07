-- Rename payment reference column (Stripe → Lemon Squeezy)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'stripe_payment_id'
  ) then
    alter table public.transactions rename column stripe_payment_id to lemonsqueezy_order_id;
  end if;
end $$;
