-- Provider prepaid wallet balances (admin-managed; estimated remaining from generation_economics).
create table if not exists public.provider_wallets (
  provider text primary key check (provider in ('byteplus', 'atlas')),
  initial_balance_usd numeric(12, 2) not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_wallet_recharges (
  id bigserial primary key,
  provider text not null references public.provider_wallets (provider) on delete restrict,
  amount_usd numeric(12, 2) not null check (amount_usd > 0),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists provider_wallet_recharges_provider_created_at_idx
  on public.provider_wallet_recharges (provider, created_at desc);

alter table public.provider_wallets enable row level security;
alter table public.provider_wallet_recharges enable row level security;

grant select, insert, update on public.provider_wallets to service_role;
grant select, insert on public.provider_wallet_recharges to service_role;

insert into public.provider_wallets (provider, initial_balance_usd, notes)
values ('byteplus', 30.10, 'Initial BytePlus prepaid deposit')
on conflict (provider) do nothing;
