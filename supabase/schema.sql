-- ==============================================================================
-- PUNE PRIME TIMES - DATABASE SCHEMA & STORAGE SETUP
-- Run this complete script in the Supabase SQL Editor.
-- ==============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
-- Links 1:1 with auth.users to store administrative roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null check (role in ('admin', 'editor')) default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- 3. ARTICLES TABLE
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content jsonb not null default '{"type": "doc", "content": []}'::jsonb,
  cover_image_url text,
  category_id uuid references public.categories(id) on delete set null,
  status text not null check (status in ('draft', 'published')) default 'draft',
  is_featured boolean not null default false,
  is_breaking boolean not null default false,
  author_id uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indices for performance and frequent queries
create index if not exists idx_articles_status_published_at on public.articles(status, published_at desc);
create index if not exists idx_articles_slug on public.articles(slug);
create index if not exists idx_articles_category_id on public.articles(category_id);
create index if not exists idx_articles_is_breaking on public.articles(is_breaking) where is_breaking = true;
create index if not exists idx_articles_is_featured on public.articles(is_featured) where is_featured = true;
create index if not exists idx_categories_slug on public.categories(slug);

-- ==============================================================================
-- TRIGGERS & FUNCTIONS
-- ==============================================================================

-- Automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_articles_updated_at on public.articles;
create trigger set_articles_updated_at
  before update on public.articles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Automatically create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'editor')
  )
  on conflict (id) do update set
    email = excluded.email;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper functions for RLS checks (Security Definer to prevent infinite recursion)
create or replace function public.is_admin_or_editor()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;

-- PROFILES POLICIES
-- 1. Users can view their own profile
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 2. Admins can view all profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- 3. Only admins can insert/update/delete profiles
drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

-- CATEGORIES POLICIES
-- 1. Public can read categories
drop policy if exists "Public categories are viewable by everyone" on public.categories;
create policy "Public categories are viewable by everyone"
  on public.categories for select
  using (true);

-- 2. Only admin and editor can insert/update/delete categories
drop policy if exists "Staff can insert categories" on public.categories;
create policy "Staff can insert categories"
  on public.categories for insert
  with check (public.is_admin_or_editor());

drop policy if exists "Staff can update categories" on public.categories;
create policy "Staff can update categories"
  on public.categories for update
  using (public.is_admin_or_editor());

drop policy if exists "Staff can delete categories" on public.categories;
create policy "Staff can delete categories"
  on public.categories for delete
  using (public.is_admin_or_editor());

-- ARTICLES POLICIES
-- 1. Public can SELECT articles only where status = 'published'
drop policy if exists "Public articles are viewable by everyone" on public.articles;
create policy "Public articles are viewable by everyone"
  on public.articles for select
  using (status = 'published');

-- 2. Staff (admin/editor) can SELECT all articles (including drafts)
drop policy if exists "Staff can view all articles" on public.articles;
create policy "Staff can view all articles"
  on public.articles for select
  using (public.is_admin_or_editor());

-- 3. Staff can INSERT articles
drop policy if exists "Staff can insert articles" on public.articles;
create policy "Staff can insert articles"
  on public.articles for insert
  with check (public.is_admin_or_editor());

-- 4. Staff can UPDATE articles
drop policy if exists "Staff can update articles" on public.articles;
create policy "Staff can update articles"
  on public.articles for update
  using (public.is_admin_or_editor());

-- 5. Staff can DELETE articles
drop policy if exists "Staff can delete articles" on public.articles;
create policy "Staff can delete articles"
  on public.articles for delete
  using (public.is_admin_or_editor());

-- ==============================================================================
-- STORAGE BUCKET & POLICIES ("news-images")
-- ==============================================================================

-- Create bucket if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-images',
  'news-images',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

-- Storage RLS policies
drop policy if exists "Public read news-images" on storage.objects;
create policy "Public read news-images"
  on storage.objects for select
  using (bucket_id = 'news-images');

drop policy if exists "Staff upload news-images" on storage.objects;
create policy "Staff upload news-images"
  on storage.objects for insert
  with check (
    bucket_id = 'news-images' and
    public.is_admin_or_editor()
  );

drop policy if exists "Staff update news-images" on storage.objects;
create policy "Staff update news-images"
  on storage.objects for update
  using (
    bucket_id = 'news-images' and
    public.is_admin_or_editor()
  );

drop policy if exists "Staff delete news-images" on storage.objects;
create policy "Staff delete news-images"
  on storage.objects for delete
  using (
    bucket_id = 'news-images' and
    public.is_admin_or_editor()
  );

-- ==============================================================================
-- SAMPLE SEED DATA
-- ==============================================================================

-- 1. Sample Categories
insert into public.categories (id, name, slug)
values
  ('11111111-1111-1111-1111-111111111111', 'City & Metro', 'city-metro'),
  ('22222222-2222-2222-2222-222222222222', 'Civic & Infra', 'civic-infra'),
  ('33333333-3333-3333-3333-333333333333', 'Tech & Innovation', 'tech-innovation'),
  ('44444444-4444-4444-4444-444444444444', 'Culture & Life', 'culture-life'),
  ('55555555-5555-5555-5555-555555555555', 'Business', 'business')
on conflict (slug) do nothing;

-- 2. Sample Published Articles
insert into public.articles (
  id,
  title,
  slug,
  excerpt,
  content,
  cover_image_url,
  category_id,
  status,
  is_featured,
  is_breaking,
  published_at
)
values
  (
    'a1111111-1111-1111-1111-111111111111',
    'Pune Metro Line 3 Hinjawadi-Shivajinagar Route Enters Final Testing Phase',
    'pune-metro-line-3-hinjawadi-shivajinagar-testing-phase',
    'The 23.2-km elevated corridor connecting the IT hub to downtown Pune prepares for technical trials, promising to halve peak-hour commute times by mid-2027.',
    '{
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "The highly anticipated Pune Metro Line 3, spanning 23.2 kilometers from the bustling information technology center of Hinjawadi to central Shivajinagar, has officially entered its comprehensive integrated testing phase today."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            {
              "type": "text",
              "text": "Overcoming Key Bottlenecks"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Jointly developed under a public-private partnership, the corridor features 23 elevated stations designed to provide seamless interchanges with Line 1 and Line 2 at District Court station. Thousands of IT professionals commuting along Wakad, Baner, and Ganeshkhind Road stand to benefit immensely once commercial services commence."
            }
          ]
        },
        {
          "type": "blockquote",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "\"Line 3 will be a lifeline for western Pune, eliminating hours of gridlock for tens of thousands of daily office-goers,\" noted transit authorities."
                }
              ]
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Trial runs will focus on signaling synchronization, power grid reliability, and platform screen door automation throughout the coming weeks."
            }
          ]
        }
      ]
    }'::jsonb,
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80',
    '22222222-2222-2222-2222-222222222222',
    'published',
    true,
    true,
    now() - interval '2 hours'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Pune Startup Ecosystem Records 40% Surge in DeepTech & AI Funding',
    'pune-startup-ecosystem-records-40-percent-surge-deeptech-ai-funding',
    'Kothrud and Baner incubators witness unprecedented venture capital interest as homegrown robotics and foundational AI models gain global enterprise traction.',
    '{
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Pune has cemented its standing as a premier technology innovation cradle in India, with local deeptech and artificial intelligence ventures pulling in record funding rounds over the last three quarters."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            {
              "type": "text",
              "text": "From Automotive Engineering to Cognitive Computing"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Traditionally recognized for automotive manufacturing and enterprise software services, Pune is rapidly pivoting toward cutting-edge hardware-software convergence, smart battery systems, and specialized industrial AI models."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Industry analysts credit the dense concentration of premier research institutes, engineering colleges, and proactive state policy incentives for fostering this high-growth ecosystem."
            }
          ]
        }
      ]
    }'::jsonb,
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
    '33333333-3333-3333-3333-333333333333',
    'published',
    false,
    false,
    now() - interval '5 hours'
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'Historic Shaniwar Wada Cultural Restoration Unveils 18th-Century Murals',
    'historic-shaniwar-wada-cultural-restoration-unveils-18th-century-murals',
    'Archaeological teams deploying non-invasive spectral imaging uncover intricate Peshwa-era botanical pigments and courtyard architectural details.',
    '{
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "A meticulous multi-year conservation effort at Shaniwar Wada has revealed never-before-seen decorative wall murals and water fountain channels dating back to the height of the Maratha Empire."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            {
              "type": "text",
              "text": "Preserving Living Heritage"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "The conservation project employs gentle botanical-based cleansers and laser scanning to document every millimeter of the remaining ramparts and gates, ensuring Pune heritage remains vibrant for generations to come."
            }
          ]
        }
      ]
    }'::jsonb,
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80',
    '44444444-4444-4444-4444-444444444444',
    'published',
    false,
    false,
    now() - interval '1 day'
  )
on conflict (slug) do nothing;
