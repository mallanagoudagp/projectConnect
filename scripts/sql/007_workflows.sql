// This extends schema with subscriptions, notifications, media.

-- Subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id text not null,
  child_id text not null,
  service_id text not null,
  amount numeric not null check (amount >= 0),
  status text not null check (status in ('pending','active','cancelled')) default 'pending',
  payment_status text not null check (payment_status in ('unpaid','paid')) default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notifications (save-then-emit)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  family_id text not null,
  type text not null,
  message text not null,
  data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_family_created on notifications(family_id, created_at desc);

-- Media uploads
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  builder_id text not null,
  subscription_id uuid,
  mime text not null,
  size int not null,
  url text not null,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

-- Basic RLS (adjust to real auth later)
alter table subscriptions enable row level security;
alter table notifications enable row level security;
alter table media enable row level security;

-- Public demo policies (allow read for all; write via API service role in real app)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename='subscriptions' and policyname='subscriptions_read_all') then
    create policy subscriptions_read_all on subscriptions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename='notifications' and policyname='notifications_read_all') then
    create policy notifications_read_all on notifications for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename='media' and policyname='media_read_all') then
    create policy media_read_all on media for select using (true);
  end if;
end $$;
