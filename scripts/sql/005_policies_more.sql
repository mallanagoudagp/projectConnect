-- RLS for new tables
alter table public.services enable row level security;
alter table public.portfolios enable row level security;
alter table public.uploads enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

-- services: readable by anyone
create policy services_read on public.services for select using (true);

-- portfolios: readable by anyone; write by the builder
create policy portfolios_read on public.portfolios for select using (true);
create policy portfolios_write on public.portfolios for insert with check (auth.uid() = builder_id);
create policy portfolios_update on public.portfolios for update using (auth.uid() = builder_id);
create policy portfolios_delete on public.portfolios for delete using (auth.uid() = builder_id);

-- uploads: builder of the project can write; readable by project participants (parent, student, builder)
create policy uploads_read on public.uploads for select using (
  exists(select 1 from public.projects p where p.id = uploads.project_id and (p.builder_id = auth.uid() or p.parent_id = auth.uid() or p.student_id = auth.uid()))
);
create policy uploads_write on public.uploads for insert with check (
  exists(select 1 from public.projects p where p.id = project_id and p.builder_id = auth.uid())
);
create policy uploads_update on public.uploads for update using (auth.uid() = builder_id);
create policy uploads_delete on public.uploads for delete using (auth.uid() = builder_id);

-- subscriptions: owner only
create policy subs_read on public.subscriptions for select using (auth.uid() = user_id);
create policy subs_write on public.subscriptions for insert with check (auth.uid() = user_id);
create policy subs_update on public.subscriptions for update using (auth.uid() = user_id);
create policy subs_delete on public.subscriptions for delete using (auth.uid() = user_id);

-- payments: only the parent who paid
create policy payments_read on public.payments for select using (auth.uid() = parent_id);
create policy payments_write on public.payments for insert with check (auth.uid() = parent_id);
