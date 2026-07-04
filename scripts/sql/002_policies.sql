-- Profiles: users can see/update their own profile
create policy "read own profile" on profiles for select using (auth.uid() = user_id);
create policy "upsert own profile" on profiles for insert with check (auth.uid() = user_id);
create policy "update own profile" on profiles for update using (auth.uid() = user_id);

-- Projects: participants (parent, student, builder) can view; parent can insert; parent or builder can update
create policy "view participant projects" on projects for select
  using (auth.uid() = parent_id or auth.uid() = student_id or auth.uid() = builder_id);

create policy "parent inserts projects" on projects for insert
  with check (auth.uid() = parent_id);

create policy "update by parent or builder" on projects for update
  using (auth.uid() = parent_id or auth.uid() = builder_id);

-- Requests: the student can manage their requests; parents can read student requests to approve (basic)
create policy "student reads own requests" on requests for select using (auth.uid() = student_id);
create policy "student creates requests" on requests for insert with check (auth.uid() = student_id);
create policy "student updates own requests" on requests for update using (auth.uid() = student_id);

-- Reviews: parent author can manage; anyone can read
create policy "read reviews" on reviews for select using (true);
create policy "parent writes review" on reviews for insert with check (auth.uid() = parent_id);
create policy "parent updates review" on reviews for update using (auth.uid() = parent_id);

-- Notifications: recipient can read their own
create policy "read own notifications" on notifications for select using (auth.uid() = recipient_id);
create policy "insert notifications (system/broad)" on notifications for insert with check (true);

-- Uploads: participants can read; builder can insert
create policy "read project uploads" on uploads for select using (
  exists (select 1 from projects p where p.id = project_id and (auth.uid() = p.parent_id or auth.uid() = p.student_id or auth.uid() = p.builder_id))
);
create policy "builder creates uploads" on uploads for insert with check (
  exists (select 1 from projects p where p.id = project_id and auth.uid() = p.builder_id)
);

-- Subscriptions: parent manages own subscription
create policy "read own subscription" on subscriptions for select using (auth.uid() = parent_id);
create policy "manage own subscription" on subscriptions for all using (auth.uid() = parent_id) with check (auth.uid() = parent_id);
