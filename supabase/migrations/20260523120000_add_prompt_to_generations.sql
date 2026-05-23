-- Store user prompt on generations for dashboard history (Atlas Cloud UI may not show Arabic).
alter table public.generations
  add column if not exists prompt text;
