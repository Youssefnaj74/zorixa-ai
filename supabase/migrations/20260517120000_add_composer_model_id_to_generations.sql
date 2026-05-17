-- Zorixa composer model id (e.g. gpt-image-2, nano-banana-pro) for dashboard history labels.
alter table public.generations
  add column if not exists composer_model_id text;
