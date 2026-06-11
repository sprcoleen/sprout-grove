-- supabase/migrations/16-release-review.sql
-- Adds Release Manager review gate fields to projects.
-- Run in Supabase Dashboard → SQL Editor.

alter table projects add column if not exists release_review_status  text         default null;
alter table projects add column if not exists release_review_comment text         default null;
alter table projects add column if not exists release_reviewed_by    text         default null;
alter table projects add column if not exists release_reviewed_at    timestamptz  default null;
alter table projects add column if not exists release_submitted_at   timestamptz  default null;
