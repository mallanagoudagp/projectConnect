-- Create role type and profiles
create type app_role as enum ('parent','student','builder');

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null,
  name text,
  created_at timestamptz default now()
);

-- Projects and requests
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'Not Started',
  progress int not null default 0,
  parent_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid references auth.users(id) on delete set null,
  builder_id uuid references auth.users(id) on delete set null,
  budget numeric(10,2) default 0,
  spent numeric(10,2) default 0,
  start_date date,
  due_date date,
  created_at timestamptz default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  budget numeric(10,2),
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- Reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  builder_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  text text,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz default now(),
  read boolean default false
);

-- Uploads
create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  builder_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  kind text not null default 'image', -- image | video
  created_at timestamptz default now()
);

-- Simple subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  renews_at timestamptz
);

-- Enable RLS
alter table profiles enable row level security;
alter table projects enable row level security;
alter table requests enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table uploads enable row level security;
alter table subscriptions enable row level security;
