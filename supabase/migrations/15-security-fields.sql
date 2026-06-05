-- supabase/migrations/15-security-fields.sql
-- Adds security & data sensitivity fields to projects.
-- Run in Supabase Dashboard → SQL Editor.

alter table projects add column if not exists requires_auth        boolean default null;
alter table projects add column if not exists external_access      boolean default null;
alter table projects add column if not exists has_sensitive_data   boolean default null;
alter table projects add column if not exists sends_to_external_ai boolean default null;
alter table projects add column if not exists stores_user_inputs   boolean default null;
