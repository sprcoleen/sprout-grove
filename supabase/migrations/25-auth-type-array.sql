-- supabase/migrations/25-auth-type-array.sql
-- Reconciles projects.auth_type with what is actually deployed.
--
-- Migration 18 declared auth_type as `text`, but production is `text[]` —
-- someone widened it in the Supabase dashboard without recording a migration.
-- db.js has always read and written it as an array (toProject/fromProject),
-- so production is correct and migration 18 is the file that is wrong.
--
-- Verified 2026-08-25 against the live database: the PostgREST array-contains
-- operator (auth_type=cs.{...}) succeeds, and scalar equality fails with
-- "malformed array literal" — both confirm text[].
--
-- This migration is a no-op on production and repairs any environment that was
-- built from migration 18 as written (e.g. a fresh staging database).
-- Run in Supabase Dashboard → SQL Editor.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'projects'
      and column_name = 'auth_type'
      and data_type   = 'text'          -- scalar text, not ARRAY
  ) then
    alter table projects
      alter column auth_type type text[]
      using case
        when auth_type is null or auth_type = '' then '{}'::text[]
        else array[auth_type]
      end;
    raise notice 'projects.auth_type widened from text to text[]';
  else
    raise notice 'projects.auth_type is already text[] — nothing to do';
  end if;
end $$;
