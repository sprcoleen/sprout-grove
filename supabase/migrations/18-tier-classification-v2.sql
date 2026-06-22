-- supabase/migrations/18-tier-classification-v2.sql
-- Revised tier classification fields.
-- Replaces the old multi-question flow with two questions + a per-tier checklist.
-- Run in Supabase Dashboard → SQL Editor.

alter table projects
  add column if not exists has_backend        boolean,
  add column if not exists target_users       text check (target_users in ('internal','external','both')),
  add column if not exists has_database       boolean,
  add column if not exists connects_sprout_db boolean,
  add column if not exists auth_type          text,
  add column if not exists data_sensitivity   text;
