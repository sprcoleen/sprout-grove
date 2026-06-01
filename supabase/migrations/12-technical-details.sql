-- 12-technical-details.sql
-- Adds three optional technical detail fields to projects.

alter table projects
  add column if not exists github_repo text,
  add column if not exists hosting     text,
  add column if not exists database    text;
