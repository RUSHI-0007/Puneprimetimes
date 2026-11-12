-- ==============================================================================
-- PUNE PRIME TIMES - AI NEWS PIPELINE MIGRATION
-- Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Extend articles table for Language, AI Drafts & Verification
alter table public.articles 
  add column if not exists language text not null default 'mr' check (language in ('mr', 'en')),
  add column if not exists ai_generated boolean not null default false,
  add column if not exists confidence text check (confidence in ('high', 'medium', 'low')),
  add column if not exists verification_notes text,
  add column if not exists image_suggestion text,
  add column if not exists source_urls jsonb default '[]'::jsonb,
  add column if not exists flags jsonb default '{}'::jsonb;

-- Helpful index for AI drafts and language filtering
create index if not exists idx_articles_ai_generated on public.articles(ai_generated, status);
create index if not exists idx_articles_language_published on public.articles(language, status, published_at desc);

-- 2. Processed Items Table (deduplication & tracking)
create table if not exists public.ai_processed_items (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text,
  outlet text,
  story_hash text,
  cluster_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_processed_items_url on public.ai_processed_items(url);
create index if not exists idx_ai_processed_items_story_hash on public.ai_processed_items(story_hash);

-- 3. AI Run Logs Table (monitoring and audit trail)
create table if not exists public.ai_run_logs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running', 'success', 'failed', 'partial')) default 'running',
  stories_found integer not null default 0,
  clusters_formed integer not null default 0,
  drafts_created integer not null default 0,
  skipped_count integer not null default 0,
  api_calls_used integer not null default 0,
  errors jsonb default '[]'::jsonb,
  notes text
);

create index if not exists idx_ai_run_logs_started_at on public.ai_run_logs(started_at desc);

-- 4. Enable RLS
alter table public.ai_processed_items enable row level security;
alter table public.ai_run_logs enable row level security;

-- 5. Policies for AI Processed Items
drop policy if exists "Editors can view processed items" on public.ai_processed_items;
create policy "Editors can view processed items"
  on public.ai_processed_items for select
  using (public.is_admin_or_editor());

drop policy if exists "Admins manage processed items" on public.ai_processed_items;
create policy "Admins manage processed items"
  on public.ai_processed_items for all
  using (public.is_admin());

-- 6. Policies for AI Run Logs
drop policy if exists "Editors can view run logs" on public.ai_run_logs;
create policy "Editors can view run logs"
  on public.ai_run_logs for select
  using (public.is_admin_or_editor());

drop policy if exists "Admins manage run logs" on public.ai_run_logs;
create policy "Admins manage run logs"
  on public.ai_run_logs for all
  using (public.is_admin());

