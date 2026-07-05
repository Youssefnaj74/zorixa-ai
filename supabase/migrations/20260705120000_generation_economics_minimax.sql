-- Allow MiniMax TTS rows in generation_economics.
alter table public.generation_economics
  drop constraint if exists generation_economics_provider_used_check;

alter table public.generation_economics
  add constraint generation_economics_provider_used_check
  check (provider_used in ('byteplus', 'atlas', 'minimax'));

alter table public.generation_economics
  drop constraint if exists generation_economics_provider_attempted_check;

alter table public.generation_economics
  add constraint generation_economics_provider_attempted_check
  check (provider_attempted is null or provider_attempted in ('byteplus', 'atlas', 'minimax'));
