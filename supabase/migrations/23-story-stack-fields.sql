-- supabase/migrations/23-story-stack-fields.sql
-- Adds story fields (problem/built/better_now), tool_used, tier, and
-- classification columns that were never added via earlier migrations.
-- Run in Supabase Dashboard → SQL Editor.

alter table projects
  -- Story fields
  add column if not exists problem             text    default null,
  add column if not exists built               text    default null,
  add column if not exists better_now          text    default null,

  -- Tech stack
  add column if not exists tool_used           text[]  default '{}',

  -- Tier (computed from has_backend × target_users; stored for query convenience)
  add column if not exists tier                integer default null
    check (tier in (1, 2, 3)),

  -- Legacy classification flags (replaced by has_backend / target_users in migration 18,
  -- but fromProject still sends them for backwards compat)
  add column if not exists is_ui_only          boolean default null,
  add column if not exists uses_external_apis  boolean default null,
  add column if not exists requires_deployment boolean default null,

  -- Sprout DB connection detail (free-text, shown when connects_sprout_db = true)
  add column if not exists sprout_db_details   text    default null;
