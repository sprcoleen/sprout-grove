-- Rooting review tickets (internal Grove tracking, not Jira)
create table if not exists rooting_reviews (
  id             uuid        default gen_random_uuid() primary key,
  project_id     text        not null,
  project_name   text,
  builder_name   text,
  builder_email  text,
  reviewer_name  text,
  reviewer_email text,
  status         text        default 'pending',  -- pending | approved | rejected
  rejection_reason text      default null,
  country        text,
  created_at     timestamptz default now(),
  resolved_at    timestamptz default null
);

alter table rooting_reviews enable row level security;
create policy "Authenticated read"  on rooting_reviews for select using (auth.role() = 'authenticated');
create policy "Authenticated insert" on rooting_reviews for insert with check (auth.role() = 'authenticated');
create policy "Service role update"  on rooting_reviews for update using (true);
