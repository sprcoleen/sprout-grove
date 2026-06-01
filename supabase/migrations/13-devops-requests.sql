-- 13-devops-requests.sql
-- Adds DevOps request tracking: is_devops flag on profiles + devops_requests table.

alter table profiles add column if not exists is_devops boolean default false;

create table if not exists devops_requests (
  id            bigint      primary key generated always as identity,
  project_id    text        not null,
  project_name  text        not null,
  builder_email text        not null,
  requested_by  text        not null,
  github_repo   text,
  hosting       text,
  database      text,
  status        text        not null default 'todo',
  devops_notes  text,
  country       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table devops_requests enable row level security;

create policy "Authenticated read" on devops_requests
  for select using (auth.role() = 'authenticated');

create policy "Any user insert" on devops_requests
  for insert with check (auth.role() = 'authenticated');

create policy "Admin or devops update" on devops_requests
  for update using (
    is_admin()
    or coalesce((select is_devops from profiles where id = auth.uid()), false)
  );

create policy "Admin delete" on devops_requests
  for delete using (is_admin());
