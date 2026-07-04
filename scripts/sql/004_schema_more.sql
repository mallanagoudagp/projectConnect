-- additional domain tables for a fuller dataset
begin;

-- Services and categories
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null, -- e.g., Plumbing, Electrical, Painting
  created_at timestamptz not null default now()
);

-- Builder portfolios (images/videos)
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  media_urls text[] default '{}',
  created_at timestamptz not null default now()
);

-- Uploads from builders per project
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  builder_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('image','video')),
  url text not null,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

-- Subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free','pro','team')),
  status text not null check (status in ('active','canceled','past_due')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Payments (mock)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.requests(id) on delete set null,
  amount_cents int not null,
  currency text not null default 'USD',
  status text not null check (status in ('pending','succeeded','failed','refunded')),
  created_at timestamptz not null default now()
);

commit;
