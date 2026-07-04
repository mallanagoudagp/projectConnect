-- richer demo data
insert into public.services (name, category) values
  ('Kitchen Remodeling','Construction'),
  ('Bathroom Renovation','Construction'),
  ('Electrical Wiring','Electrical'),
  ('Interior Painting','Painting')
on conflict do nothing;

-- portfolios require existing builder users; these are examples referencing any builder id if available
-- Replace the SELECTs with actual builder UUIDs from your auth.users when ready
-- Here we pick any builder from public.builders table if you created one; otherwise this will insert zero rows.
insert into public.portfolios (builder_id, title, description, media_urls)
select b.user_id, 'Modern Kitchen', 'Quartz counters, oak cabinets, matte fixtures', array['/images/hero-dashboard.png']
from public.builders b
limit 1;

-- subscriptions (free for all users initially)
insert into public.subscriptions (user_id, plan, status)
select id, 'free', 'active' from auth.users
on conflict do nothing;
