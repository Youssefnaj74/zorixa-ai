-- Run in Supabase SQL Editor if support_requests already exists.

alter table public.support_requests
  add column if not exists issue_type text,
  add column if not exists screenshot_url text;

-- New installs: use supabase/schema.sql (issue_type + subject both required).
