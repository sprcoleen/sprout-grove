-- supabase/migrations/17-delete-requests.sql
-- Deletion request queue. Neither projects nor wishes are hard-deleted until an admin approves.
-- Run in Supabase Dashboard → SQL Editor.

create table if not exists delete_requests (
  id           bigint generated always as identity primary key,
  entity_type  text        not null check (entity_type in ('project','wish')),
  entity_id    text        not null,
  entity_name  text        not null,
  requested_by text        not null,
  reason       text        not null,
  status       text        not null default 'pending' check (status in ('pending','approved','denied')),
  reviewed_by  text,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table delete_requests enable row level security;

-- Anyone authenticated can submit a request for their own entry
create policy "User insert own request" on delete_requests for insert
  with check (auth.role() = 'authenticated' and auth.email() = requested_by);

-- Authenticated users can read all requests (builders see their own; admins see all in UI)
create policy "Authenticated read" on delete_requests for select
  using (auth.role() = 'authenticated');

-- Only admins can update (approve / deny)
create policy "Admin update" on delete_requests for update
  using (is_admin());

-- Only admins can delete request records
create policy "Admin delete" on delete_requests for delete
  using (is_admin());
